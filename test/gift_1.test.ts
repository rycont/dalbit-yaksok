import { assertEquals } from '@std/assert'
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

Deno.test('표준 EVERY - 모든 요소 만족 (참)', async () => {
    const output = await runStandard(`
결과: @표준 ([1, 2, 3])의 모든 요소가 (람다 숫자: 숫자 > 0)를 만족하는지확인
결과 보여주기
`)
    assertEquals(output, '참')
})

Deno.test('표준 EVERY - 일부 요소 불만족 (거짓)', async () => {
    const output = await runStandard(`
결과: @표준 ([1, 2, -1])의 모든 요소가 (람다 숫자: 숫자 > 0)를 만족하는지확인
결과 보여주기
`)
    assertEquals(output, '거짓')
})

Deno.test('표준 SOME - 일부 요소 만족 (참)', async () => {
    const output = await runStandard(`
결과: @표준 ([-1, 0, 1])의 요소 중 하나라도 (람다 숫자: 숫자 > 0)를 만족하는지확인
결과 보여주기
`)
    assertEquals(output, '참')
})

Deno.test('표준 SOME - 모든 요소 불만족 (거짓)', async () => {
    const output = await runStandard(`
결과: @표준 ([-1, -2, -3])의 요소 중 하나라도 (람다 숫자: 숫자 > 0)를 만족하는지확인
결과 보여주기
`)
    assertEquals(output, '거짓')
})
