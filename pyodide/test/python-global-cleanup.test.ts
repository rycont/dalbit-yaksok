import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: GET_GLOBAL 실패 후 내부 전역 누수 방지',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const session = new YaksokSession()
        await session.extend(new Pyodide())

        session.addModule('first', `list(map(missingFn, [1])) 보여주기`)
        const firstResults = await session.runModule('first')
        const firstResult = firstResults.get('first')!
        assertEquals(firstResult.reason, 'error')

        session.addModule('second', `hasattr(__yak_builtins, "abs") 보여주기`)
        const secondResults = await session.runModule('second')
        const secondResult = secondResults.get('second')!
        assertEquals(secondResult.reason, 'error')
    },
})
