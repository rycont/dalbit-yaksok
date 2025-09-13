import { YaksokSession } from '@dalbit-yaksok/core'
import { assert } from '@std/assert'

import { Pyodide } from '../pyodide/mod.ts'

Deno.test({
    name: 'Pyodide: from random import randint, call and print',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        // 브라우저 환경이 아니면 Pyodide 실행을 건너뜀
        if (typeof (globalThis as any).document === 'undefined') {
            return
        }
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

        const result = await session.runModule('main')
        assert(result.reason === 'finish')

        const parsed = parseInt(output.trim(), 10)
        assert(Number.isInteger(parsed))
        assert(0 <= parsed && parsed <= 10)
    },
})


