import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assert } from '@std/assert'

Deno.test({
    name: 'Pyodide: only import statement runs',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const session = new YaksokSession()
        await session.extend(new Pyodide())

        session.addModule('main', `from random import randint\n`)

        const result = await session.runModule('main')
        assert(result.reason === 'finish')
    },
})


