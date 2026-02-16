import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: print() 빈 줄 출력 보존',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const lines: string[] = []

        const session = new YaksokSession({
            stdout: (text) => {
                lines.push(text)
            },
        })

        await session.extend(new Pyodide())
        session.addModule('main', `print()
print("x")`)

        const results = await session.runModule('main')
        const result = results.get('main')!

        assertEquals(result.reason, 'finish')
        assertEquals(lines, ['', 'x'])
    },
})
