import { assertIsError } from '@std/assert'
import { AmbiguousFormulaBoundary, YaksokSession } from '@dalbit-yaksok/core'

async function run(code: string) {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', code)
    return codeFile
}

// ─── SHOULD throw ────────────────────────────────────────────────────────────

Deno.test('함수 결과를 괄호 없이 비교식에 사용 - 함수인자 앞에서 Formula 생성', async () => {
    // `배열 개수 <= 5` — BASIC_RULES reduces `개수 <= 5` into Formula(개수,<=,5)
    // leaving `배열`(Identifier) as an orphaned argument in the buffer.
    const codeFile = await run(`
약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 배열 개수 <= 5 이면
    "실행" 보여주기
`)
    assertIsError(codeFile.prepareErrors[0], AmbiguousFormulaBoundary)
})

Deno.test('함수 결과를 괄호 없이 비교식에 사용 - Formula가 함수 인자로 전달', async () => {
    // `1 <= 배열 개수` — BASIC_RULES reduces `1 <= 배열` into Formula first,
    // then FunctionInvoke factory receives Formula as the first param.
    const codeFile = await run(`
약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 1 <= 배열 개수 이면
    "실행" 보여주기
`)
    assertIsError(codeFile.prepareErrors[0], AmbiguousFormulaBoundary)
})

// ─── Should NOT throw ─────────────────────────────────────────────────────────

Deno.test('예약어(만약) 뒤 단순 비교식은 오류 없음', async () => {
    // `만약 n <= 1 이면` — `만약` is a reserved keyword, not a function arg
    const codeFile = await run(`
약속, (n) 팩토리얼
    만약 n <= 1 이면
        1 반환하기
    n * ((n - 1) 팩토리얼) 반환하기

5 팩토리얼 보여주기
`)
    await codeFile.run()
})

Deno.test('예약어(반복) 뒤 비교식은 오류 없음', async () => {
    // `반복 i < 10 동안` — `반복` is a reserved keyword
    const codeFile = await run(`
i = 0
합계 = 0
반복 i < 5 동안
    합계 = 합계 + i
    i = i + 1
합계 보여주기
`)
    await codeFile.run()
})

Deno.test('괄호로 감싼 함수 결과는 오류 없음', async () => {
    // `(배열 개수) <= 5` — parentheses resolve the ambiguity
    const codeFile = await run(`
약속, (목록) 개수
    3 반환하기

배열 = [1, 2, 3]
만약 (배열 개수) <= 5 이면
    "정상" 보여주기
`)
    await codeFile.run()
})

Deno.test('비교 연산자 Formula는 여전히 오류', async () => {
    // `1 == 10 사이 무작위 값` — Formula(1,==,10) is NOT a range, must throw.
    const codeFile = await run(`
약속, (범위) 사이 무작위 값
    1 반환하기

값 = 1 == 10 사이 무작위 값
값 보여주기
`)
    assertIsError(codeFile.prepareErrors[0], AmbiguousFormulaBoundary)
})
