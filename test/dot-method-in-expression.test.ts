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
