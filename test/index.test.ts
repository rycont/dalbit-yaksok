import { test, expect } from 'vite-plus/test'
import { opendir, readFile } from 'node:fs/promises'

import { YaksokSession } from '@dalbit-yaksok/core'

const codesDir = `${import.meta.dirname}/codes`

for await (const file of await opendir(codesDir)) {
    if (file.isFile() && file.name.endsWith('.yak')) {
        test(file.name, async () => {
            let printed = ''

            const filePath = `${codesDir}/${file.name}`
            const code = await readFile(filePath, {
                encoding: 'utf8',
            })

            const expectedFilePath = filePath + '.out'
            const expected = (
                await readFile(expectedFilePath, {
                    encoding: 'utf8',
                })
            ).replace(/\r\n/g, '\n')

            const session = new YaksokSession({
                stdout(message: string) {
                    printed += message + '\n'
                },
            })

            await session.addModule('main', code).run()

            expect(printed).toBe(expected)
        })
    }
}
