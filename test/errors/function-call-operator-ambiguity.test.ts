/**
 * Regression tests for FunctionCallOperatorAmbiguityError —
 * detects when a function call result is used directly in a formula
 * without parentheses, e.g. `배열 개수 <= 5` instead of `(배열 개수) <= 5`.
 *
 * Two detection points:
 * 1. SRParse: `Identifier(arg) Formula(starts_with_Identifier, ...)` — formula
 *    greedily consumed the function name before FunctionInvoke could form.
 *    Guarded by RESERVED_WORDS: keywords like `만약`, `반복` before a plain
 *    formula must not trigger this.
 * 2. FunctionInvoke factory: first param is a raw Formula (not ValueWithParenthesis),
 *    meaning the formula was the argument — `1 <= 배열 개수` case.
 */

import { assert, assertIsError } from '@std/assert'
import { FunctionCallOperatorAmbiguityError } from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

async function run(code: string) {
    const session = new YaksokSession()
    session.addModule('main', code)
    const results = await session.runModule('main')
    return results.get('main')!
}

// ─── SHOULD throw ────────────────────────────────────────────────────────────

Deno.test('함수 결과를 괄호 없이 비교식에 사용 - 함수인자 앞에서 Formula 생성', async () => {
    // `배열 개수 <= 5` — BASIC_RULES reduces `개수 <= 5` into Formula(개수,<=,5)
    // leaving `배열`(Identifier) as an orphaned argument in the buffer.
    const result = await run(`
약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 배열 개수 <= 5 이면
    "실행" 보여주기
`)
    assert(
        result.reason === 'validation',
        `Expected validation, got ${result.reason}`,
    )
    assertIsError(
        result.errors.get('main')![0],
        FunctionCallOperatorAmbiguityError,
    )
})

Deno.test('함수 결과를 괄호 없이 비교식에 사용 - Formula가 함수 인자로 전달', async () => {
    // `1 <= 배열 개수` — BASIC_RULES reduces `1 <= 배열` into Formula first,
    // then FunctionInvoke factory receives Formula as the first param.
    const result = await run(`
약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 1 <= 배열 개수 이면
    "실행" 보여주기
`)
    assert(
        result.reason === 'validation',
        `Expected validation, got ${result.reason}`,
    )
    assertIsError(
        result.errors.get('main')![0],
        FunctionCallOperatorAmbiguityError,
    )
})

// ─── Should NOT throw ─────────────────────────────────────────────────────────

Deno.test('예약어(만약) 뒤 단순 비교식은 오류 없음', async () => {
    // `만약 n <= 1 이면` — `만약` is a reserved keyword, not a function arg
    const result = await run(`
약속, (n) 팩토리얼
    만약 n <= 1 이면
        1 반환하기
    n * ((n - 1) 팩토리얼) 반환하기

5 팩토리얼 보여주기
`)
    assert(
        result.reason === 'finish',
        `Expected finish, got ${result.reason}`,
    )
})

Deno.test('예약어(반복) 뒤 비교식은 오류 없음', async () => {
    // `반복 i < 10 동안` — `반복` is a reserved keyword
    const result = await run(`
i = 0
합계 = 0
반복 i < 5 동안
    합계 = 합계 + i
    i = i + 1
합계 보여주기
`)
    assert(
        result.reason === 'finish',
        `Expected finish, got ${result.reason}`,
    )
})

Deno.test('괄호로 감싼 함수 결과는 오류 없음', async () => {
    // `(배열 개수) <= 5` — parentheses resolve the ambiguity
    const result = await run(`
약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 (배열 개수) <= 5 이면
    "정상" 보여주기
`)
    assert(
        result.reason === 'finish',
        `Expected finish, got ${result.reason}`,
    )
})

Deno.test('.property 비교식은 모호성 오류 없음 (좌변)', async () => {
    // `리스트.길이 > 0` — dot-member access is a FetchMember, not a FunctionInvoke.
    // The parser must not throw FunctionCallOperatorAmbiguityError here.
    // (Runtime may fail without StandardExtension, but parse must succeed.)
    const result = await run(`
리스트 = [1, 2, 3]
만약 리스트.길이 > 0 이면
    "비어있지 않음" 보여주기
`)
    if (result.reason === 'validation') {
        const errors = [...(result.errors?.values() ?? [])].flat()
        assert(
            !errors.some((e) => e instanceof FunctionCallOperatorAmbiguityError),
            `FunctionCallOperatorAmbiguityError must not fire for dot-member access`,
        )
    }
})

// ─── Range Formula 허용 ───────────────────────────────────────────────────────

Deno.test('범위 Formula(Evaluable~Evaluable)를 인자로 전달 - 오류 없음', async () => {
    // `1~10 사이 무작위 값` — RangeFormula(1,~,10) is the argument.
    // This should NOT throw because a range has unambiguous boundaries.
    const result = await run(`
약속, (범위) 사이 무작위 값
    1 반환하기

값 = 1~10 사이 무작위 값
값 보여주기
`)
    assert(
        result.reason !== 'validation' ||
            !(result.errors?.get('main') ?? []).some(
                (e) => e instanceof FunctionCallOperatorAmbiguityError,
            ),
        'RangeFormula as argument must not trigger FunctionCallOperatorAmbiguityError',
    )
})

Deno.test('변수~변수 범위 Formula를 인자로 전달 - 오류 없음', async () => {
    // `시작~끝 사이 무작위 값` — both sides are Identifiers, still a RangeFormula.
    const result = await run(`
약속, (범위) 사이 무작위 값
    1 반환하기

시작 = 1
끝 = 100
값 = 시작~끝 사이 무작위 값
값 보여주기
`)
    assert(
        result.reason !== 'validation' ||
            !(result.errors?.get('main') ?? []).some(
                (e) => e instanceof FunctionCallOperatorAmbiguityError,
            ),
        'Variable~Variable RangeFormula as argument must not trigger FunctionCallOperatorAmbiguityError',
    )
})

Deno.test('비교 연산자 Formula는 여전히 오류', async () => {
    // `1 == 10 사이 무작위 값` — Formula(1,==,10) is NOT a range, must throw.
    const result = await run(`
약속, (범위) 사이 무작위 값
    1 반환하기

값 = 1 == 10 사이 무작위 값
값 보여주기
`)
    assert(
        result.reason === 'validation',
        `Expected validation error, got ${result.reason}`,
    )
    assertIsError(
        result.errors!.get('main')![0],
        FunctionCallOperatorAmbiguityError,
    )
})

Deno.test('.property 비교식은 모호성 오류 없음 (우변)', async () => {
    // `i < 리스트.길이` — dot-member access on the right side of an operator.
    // The parser must not throw FunctionCallOperatorAmbiguityError here.
    const result = await run(`
리스트 = [1, 2, 3]
i = 0
합계 = 0
반복 i < 리스트.길이 동안
    합계 = 합계 + 리스트[i]
    i = i + 1
합계 보여주기
`)
    if (result.reason === 'validation') {
        const errors = [...(result.errors?.values() ?? [])].flat()
        assert(
            !errors.some((e) => e instanceof FunctionCallOperatorAmbiguityError),
            `FunctionCallOperatorAmbiguityError must not fire for dot-member access`,
        )
    }
})
