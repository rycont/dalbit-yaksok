import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: math.pow deterministic call',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        let output = ''

        const session = new YaksokSession({
            stdout: (text) => {
                output += text
            },
        })

        await session.extend(new Pyodide())

        session.addModule(
            'main',
            `from math import pow
pow(2, 3) 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!
        assertEquals(result.reason, 'finish')
        assertEquals(output.trim(), '8')
    },
})


