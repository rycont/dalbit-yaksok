import { YaksokSession } from '../core/mod.ts'
import { StandardExtension } from '../exts/standard/mod.ts'

async function runStandard(code: string): Promise<string> {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    await session.extend(new StandardExtension())
    session.addModule('main', code)
    await session.runModule('main')

    return output.trim()
}

Deno.test('표준 정렬 - 숫자 정렬', async () => {
    const output = await runStandard(`
결과 = [10, 5, 30, 1] (람다 숫자: 숫자) 정렬하기
결과 보여주기
`)
    console.log('OUTPUT:', output)
})
