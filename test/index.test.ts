import { assertEquals } from '@std/assert'
import { YaksokSession } from '../../core/mod.ts'

for (const file of Deno.readDirSync(import.meta.dirname!)) {
    if (file.isFile && file.name.endsWith('.yak')) {
        Deno.test(file.name, async () => {
            let printed = ''

            const filePath = `${import.meta.dirname}/${file.name}`
            const code = await Deno.readTextFile(filePath)

            const expectedFilePath = filePath + '.out'
            let expected = await Deno.readTextFile(expectedFilePath)

            const session = new YaksokSession({
                stdout(message) {
                    printed += message + '\n'
                },
            })

            session.addModule('main', code)
            await session.runModule('main')

            if (expected.includes('\r')) {
                expected = expected.replace(/\r\n/g, '\n')
            }

            assertEquals(printed, expected)
        })
    }
}
