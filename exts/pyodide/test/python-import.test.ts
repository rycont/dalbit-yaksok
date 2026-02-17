import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assert } from '@std/assert'

Deno.test({
    name: 'Pyodide: from random import randint, call and print',
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
숫자 = randint(0, 10)
숫자 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!
        assert(result.reason === 'finish')

        const parsed = parseInt(output.trim(), 10)
        assert(Number.isInteger(parsed))
        assert(0 <= parsed && parsed <= 10)
    },
})
