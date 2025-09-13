import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from '@std/assert'
import { Pyodide } from '../pyodide/mod.ts'

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

        const result = await session.runModule('main')
        assertEquals(result.reason, 'finish')
        assertEquals(output.trim(), '8')
    },
})


