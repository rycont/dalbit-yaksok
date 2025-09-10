import { YaksokSession } from './core/mod.ts'
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'

const dir = './test/codes'

for await (const file of Deno.readDir(dir)) {
    if (!file.name.endsWith('.yak')) {
        continue
    }

    Deno.test(file.name, async () => {
        const yakPath = `${dir}/${file.name}`
        const outPath = `${dir}/${file.name}.out`

        const code = await Deno.readTextFile(yakPath)
        const expectedOutput = await Deno.readTextFile(outPath)

        let output = ''
        const session = new YaksokSession({
            stdout: (text: string) => {
                output += text + '\n'
            },
        })
        session.addModule('main', code)
        await session.runModule('main')

        assertEquals(output.trim(), expectedOutput.trim())
    })
}
