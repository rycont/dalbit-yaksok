import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: 영문 식별자 자동 Python fallback은 Python 호출 문맥에서만 허용',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const session = new YaksokSession()
        await session.extend(new Pyodide())

        session.addModule('main', `missingEnglish 보여주기`)

        const results = await session.runModule('main')
        const result = results.get('main')!

        assertEquals(result.reason, 'validation')
    },
})
