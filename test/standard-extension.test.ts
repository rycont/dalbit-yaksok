import { assert, assertEquals, assertRejects } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import { StandardExtension } from '../exts/standard/mod.ts'

async function runStandard(code: string): Promise<string> {
    let output = ''
    let errorOutput = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
        stderr(value) {
            errorOutput += value + '\n'
        },
    })

    const standard = new StandardExtension()
    await session.extend(standard)
    await session.setBaseContext(standard.manifest.module!['표준'])
    session.addModule('main', code)
    await session.runModule('main')

    if (errorOutput.trim()) {
        throw new Error(errorOutput.trim())
    }

    return output.trim()
}

Deno.test('표준 filter - 값 기준 필터링', async () => {
    const output = await runStandard(`
결과 = [1, 2, 3, 4, 5].(람다 값: 값 > 3)로 거르기
결과 보여주기
`)
    assertEquals(output, '[4, 5]')
})

Deno.test('표준 filter - 인덱스 사용', async () => {
    const output = await runStandard(`
결과 = [10, 20, 30, 40, 50].(람다 값, 순번: 순번 % 2 == 0)로 거르기
결과 보여주기
`)
    assertEquals(output, '[10, 30, 50]')
})

Deno.test('표준 filter - 판별함수 타입 검사', async () => {
    await assertRejects(
        () =>
            runStandard(`
결과 = [1, 2, 3].("약속아님")로 거르기
결과 보여주기
`),
        Error,
        '판별함수는 약속(람다)이어야 해요.',
    )
})

// Deno.test('표준 filter - 괄호 없는 람다 메소드 호출', async () => {
//     const result = await runStandard(`
// 결과 = [1, 2, 3].모두 람다 숫자: 숫자 > 0 인지
// 결과 보여주기
// `)
//     assertEquals(result.trim(), '참')
// })

Deno.test('표준 filter - 람다 괄호 있음: 다른 오류를 유지', async () => {
    const error = await assertRejects(
        () =>
            runStandard(`
결과 = [1, 2, 3].모두 (람다 숫자 숫자 > 0) 인지
결과 보여주기
`),
        Error,
    )

    assert(
        !error.message.includes(
            '람다 문법이 잘못되었어요. 람다 예시: `리스트.모두 (람다 숫자: 숫자 > 0)인지',
        ),
    )
})

Deno.test('표준 filter - 문자열 값 기준 필터링', async () => {
    const output = await runStandard(`
결과 = "Hello World".(람다 글자: 글자 == "o" 이거나 글자 == "H")로 거르기
결과 보여주기
`)
    assertEquals(output, 'Hoo')
})

Deno.test('표준 filter - 문자열 인덱스 사용', async () => {
    const output = await runStandard(`
결과 = "Programming".(람다 글자, 순번: 순번 % 2 == 0)로 거르기
결과 보여주기
`)
    assertEquals(output, 'Pormig')
})
