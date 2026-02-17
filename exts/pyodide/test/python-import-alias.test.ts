import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: import / import as bindings are available in scope',
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

        session.addModule(
            'main',
            `import math
math.sqrt(9) 보여주기
import math as m
m.pow(2, 3) 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!
        assertEquals(result.reason, 'finish')

        assertEquals(lines[0], '3')
        assertEquals(lines[1], '8')
    },
})
