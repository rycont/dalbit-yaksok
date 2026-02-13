import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide rules: dot access works on yaksok dictionary too',
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
            `학생 = {
    이름: "하랑",
    점수: 95
}

학생.이름 보여주기
학생.점수 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!
        assertEquals(result.reason, 'finish')
        assertEquals(output.includes('하랑'), true)
        assertEquals(output.includes('95'), true)
    },
})
