import { YaksokSession } from '@dalbit-yaksok/core'
import { assert } from '@std/assert'
import { Pyodide } from '../pyodide/mod.ts'

Deno.test({
    name: 'Pyodide: call randint and print without assignment',
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
            `from random import randint
randint(0, 10) 보여주기`,
        )

        const result = await session.runModule('main')
        assert(result.reason === 'finish')

        const parsed = parseInt(output.trim(), 10)
        assert(Number.isInteger(parsed))
        assert(0 <= parsed && parsed <= 10)
    },
})


