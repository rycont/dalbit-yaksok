import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: Python global builtins are callable without import',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const lines: string[] = []

        const session = new YaksokSession({
            stdout: (text) => {
                lines.push(text)
            },
        })

        await session.extend(new Pyodide())

        session.addModule(
            'main',
            `print("hello")
abs(-7) 보여주기
len([1, 2, 3]) 보여주기
list(range(0, 3)) 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!
        assertEquals(result.reason, 'finish')

        assertEquals(lines[0], 'hello')
        assertEquals(lines[1], '7')
        assertEquals(lines[2], '3')
        assertEquals(lines[3].includes('0'), true)
        assertEquals(lines[3].includes('1'), true)
        assertEquals(lines[3].includes('2'), true)
    },
})
