import { assertEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import { StandardExtension } from '../exts/standard/mod.ts'

async function runStandard(code: string): Promise<string> {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    const standard = new StandardExtension()
    await session.extend(standard)
    await session.setBaseContext(standard.manifest.module!['표준'])
    session.addModule('main', code)
    await session.runModule('main')

    return output.trim()
}

Deno.test('표준 trim - 양쪽 공백 제거', async () => {
    const output = await runStandard(`
결과 = "  안녕 세상아  ".양쪽 공백 지우기
결과 보여주기
`)
    assertEquals(output, '안녕 세상아')
})
