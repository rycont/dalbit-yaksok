import { assertEquals } from '@std/assert'
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

Deno.test('표준 EVERY - 모든 요소 만족 (참)', async () => {
    const output = await runStandard(`
결과 = [1, 2, 3].모두 (람다 숫자: 숫자 > 0) 인지
결과 보여주기
`)
    assertEquals(output, '참')
})

Deno.test('표준 EVERY - 일부 요소 불만족 (거짓)', async () => {
    const output = await runStandard(`
결과 = [1, 2, -1].모두 (람다 숫자: 숫자 > 0) 인지
결과 보여주기
`)
    assertEquals(output, '거짓')
})

Deno.test('표준 SOME - 일부 요소 만족 (참)', async () => {
    const output = await runStandard(`
결과 = [-1, 0, 1].하나라도 (람다 숫자: 숫자 > 0) 인지
결과 보여주기
`)
    assertEquals(output, '참')
})

Deno.test('표준 SOME - 모든 요소 불만족 (거짓)', async () => {
    const output = await runStandard(`
결과 = [-1, -2, -3].하나라도 (람다 숫자: 숫자 > 0) 인지
결과 보여주기
`)
    assertEquals(output, '거짓')
})
