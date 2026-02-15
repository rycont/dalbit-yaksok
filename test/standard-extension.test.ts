import { assertEquals, assertRejects } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import { StandardExtension } from '../standard/mod.ts'

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

    await session.extend(new StandardExtension())
    session.addModule('main', code)
    await session.runModule('main')

    if (errorOutput.trim()) {
        throw new Error(errorOutput.trim())
    }

    return output.trim()
}

Deno.test('표준 filter - 값 기준 필터링', async () => {
    const output = await runStandard(`
결과 = @표준 ([1, 2, 3, 4, 5])를 (람다 값: 값 > 3)로 filter
결과 보여주기
`)
    assertEquals(output, '[4, 5]')
})

Deno.test('표준 filter - 인덱스 사용', async () => {
    const output = await runStandard(`
결과 = @표준 ([10, 20, 30, 40, 50])를 (람다 값, 순번: 순번 % 2 == 0)로 거르기
결과 보여주기
`)
    assertEquals(output, '[10, 30, 50]')
})

Deno.test('표준 filter - 판별함수 타입 검사', async () => {
    await assertRejects(
        () =>
            runStandard(`
결과 = @표준 ([1, 2, 3])를 ("약속아님")로 filter
결과 보여주기
`),
        Error,
        '판별함수는 약속(람다)이어야 해요.',
    )
})
