import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: dotted import (from numpy.random import randint)',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        let output = ''

        const session = new YaksokSession({
            stdout: (text) => {
                output += text
            },
        })

        await session.extend(new Pyodide(['numpy']))

        session.addModule(
            'main',
            `from numpy.random import randint
randint(0, 1) 보여주기`,
        )

        const result = await session.runModule('main')
        

        if (result.reason === 'error') {
            console.error(result.error)
        }

        assertEquals(result.reason, 'finish')

        const v = Number(output.trim())
        assertEquals(Number.isInteger(v), true)
        assertEquals(v === 0 || v === 1, true)
    },
})


