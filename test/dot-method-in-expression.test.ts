/**
 * Regression tests for the parser bug where `.method` access after an operator
 * would incorrectly make the entire expression the receiver of the method call.
 *
 * Bug: `i < 리스트.길이` was parsed as `MemberFunctionInvoke(Formula(i, <, 리스트), 길이)`
 * instead of `Formula(i, <, FetchMember(리스트, 길이))`.
 *
 * Root cause: In srParse.ts, DOT_FETCH_MEMBER_RULES ran after externalPatterns[1]
 * (method invoke rules), so the method invoke rule consumed `Formula . Identifier`
 * before DOT_FETCH_MEMBER_RULES could rewrite it correctly.
 */

import { assertEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import { StandardExtension } from '../exts/standard/mod.ts'

async function run(code: string): Promise<string> {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
        stderr(value) {
            console.error(value)
        },
    })

    const standard = new StandardExtension()
    await session.extend(standard)
    await session.setBaseContext(standard.manifest.module!['표준'])

    session.addModule('main', code)
    await session.runModule('main')

    return output.trim()
}

Deno.test('비교 연산자 오른쪽에 .method 사용 - 기본', async () => {
    // `0 < 리스트.길이` should evaluate FetchMember(리스트, 길이) then compare
    const result = await run(`
리스트 = [1, 2, 3, 4, 5]
만약 0 < 리스트.길이 이면
    "참" 보여주기
아니면
    "거짓" 보여주기
`)
    assertEquals(result, '참')
})

Deno.test('비교 연산자 오른쪽에 .method 사용 - 반복문 조건', async () => {
    // `i < 리스트.길이` in a while-loop condition is the original failing case
    const result = await run(`
리스트 = [10, 20, 30]
합계 = 0
i = 0
반복 i < 리스트.길이 동안
    합계 = 합계 + 리스트[i]
    i = i + 1
합계 보여주기
`)
    assertEquals(result, '60')
})

Deno.test('비교 연산자 오른쪽에 .method 사용 - 동등비교', async () => {
    const result = await run(`
글자들 = ["a", "b", "c"]
만약 글자들.길이 == 3 이면
    "정확해" 보여주기
`)
    assertEquals(result, '정확해')
})

Deno.test('비교 연산자 왼쪽에 .method 사용', async () => {
    const result = await run(`
리스트 = [1, 2, 3]
만약 리스트.길이 > 0 이면
    "비어있지 않음" 보여주기
`)
    assertEquals(result, '비어있지 않음')
})

Deno.test('.method 단독 사용 (기존 동작 유지)', async () => {
    const result = await run(`
리스트 = [1, 2, 3, 4]
리스트.길이 보여주기
`)
    assertEquals(result, '4')
})

Deno.test('이고(AND) 복합 조건에서 양쪽 .method 사용 - 머지소트 핵심 패턴', async () => {
    // `i < a.길이 이고 j < b.길이` — 이고로 연결된 두 비교식 모두 오른쪽에 .method
    // 이고 연산자가 Formula 평탄화를 일으켜 Formula(i,<,MFI(a,길이),이고,Formula(j,<,b))
    // 형태가 되고, 마지막 .길이가 내부 Formula까지 재귀적으로 수정되어야 한다
    const result = await run(`
왼쪽 = [1, 3, 5]
오른쪽 = [2, 4, 6]
합계 = 0
i = 0
j = 0
반복 i < 왼쪽.길이 이고 j < 오른쪽.길이 동안
    합계 = 합계 + 왼쪽[i] + 오른쪽[j]
    i = i + 1
    j = j + 1
합계 보여주기
`)
    assertEquals(result, '21')
})

Deno.test('.(함수호출) 추가하기 - 인수 있는 함수 호출 결과를 리스트에 추가', async () => {
    // `결과.(1~100 사이 무작위 값 가져오기) 추가하기` was failing with
    // "추가하기 라는 변수나 약속을 찾을 수 없어요" because DOT_MEMBER_FUNCTION_INVOKE_RULES
    // was consuming `결과.(FI)` before externalPatterns[1] could match the 4-token
    // `[Ev, '.', Ev, '추가하기']` pattern.
    const result = await run(`
약속, (a) 두배
    a * 2 반환하기

결과 = []
결과.(3 두배) 추가하기
결과.(5 두배) 추가하기
결과 보여주기
`)
    assertEquals(result, '[6, 10]')
})

Deno.test('머지소트 전체 동작', async () => {
    const result = await run(`
약속, (왼쪽) 과 (오른쪽) 합치기
    결과 = []
    i = 0
    j = 0
    반복 i < 왼쪽.길이 이고 j < 오른쪽.길이 동안
        만약 왼쪽[i] <= 오른쪽[j] 이면
            결과.(왼쪽[i]) 추가하기
            i = i + 1
        아니면
            결과.(오른쪽[j]) 추가하기
            j = j + 1
    반복 i < 왼쪽.길이 동안
        결과.(왼쪽[i]) 추가하기
        i = i + 1
    반복 j < 오른쪽.길이 동안
        결과.(오른쪽[j]) 추가하기
        j = j + 1
    결과 반환하기

약속, (배열) 머지소트
    만약 배열.길이 <= 1 이면
        배열 반환하기
    중간 = 배열.길이 // 2
    왼쪽 = []
    오른쪽 = []
    반복 0~(중간 - 1) 의 i 마다
        왼쪽.(배열[i]) 추가하기
    반복 중간~(배열.길이 - 1) 의 i 마다
        오른쪽.(배열[i]) 추가하기
    왼쪽 = 왼쪽 머지소트
    오른쪽 = 오른쪽 머지소트
    (왼쪽) 과 (오른쪽) 합치기 반환하기

배열 = [64, 34, 25, 12, 22, 11, 90]
정렬된배열 = 배열 머지소트
정렬된배열 보여주기
`)
    assertEquals(result, '[11, 12, 22, 25, 34, 64, 90]')
})
