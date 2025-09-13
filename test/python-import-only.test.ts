import { YaksokSession } from '@dalbit-yaksok/core'
import { assert } from '@std/assert'
import { Pyodide } from '../pyodide/mod.ts'

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


