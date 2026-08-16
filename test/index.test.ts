import { assertEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'

const codesDir = `${import.meta.dirname}/codes`
for (const file of Deno.readDirSync(codesDir)) {
    if (file.isFile && file.name.endsWith('.yak')) {
        Deno.test(file.name, async () => {
            let printed = ''

            const filePath = `${codesDir}/${file.name}`
            const code = await Deno.readTextFile(filePath)

            const expectedFilePath = filePath + '.out'
            let expected = await Deno.readTextFile(expectedFilePath)

            const session = new YaksokSession({
                stdout(message: string) {
                    printed += message + '\n'
                },
            })

            session.addModule('main', code)
            const results = await session.runModule('main')
            const result = results.get('main')!

            if (result.reason === 'error') {
                throw result.error
            }

            if (result.reason === 'validation') {
                const errorMessages = Array.from(result.errors.values()).flat().map(e => e.message).join('\n')
                throw new Error('Validation failed:\n' + errorMessages)
            }

            if (expected.includes('\r')) {
                expected = expected.replace(/\r\n/g, '\n')
            }

            assertEquals(printed, expected)
        })
    }
}
