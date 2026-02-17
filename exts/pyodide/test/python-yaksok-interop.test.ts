import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'
import { StandardExtension } from '../../standard/mod.ts'

Deno.test({
    name: 'Pyodide + 약속 interop: 표준 메소드와 Python builtin 함께 사용',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const lines: string[] = []

        const session = new YaksokSession({
            stdout: (text) => {
                lines.push(text)
            },
        })

        const standard = new StandardExtension()
        await session.extend(standard)
        await session.setBaseContext(standard.manifest.module!['표준'])
        await session.extend(new Pyodide())

        session.addModule(
            'main',
            `분리 = "a,b,c,d".(",")로 자르기
len(분리) 보여주기

합 = [1, 2, 3].합계 구하기
합 보여주기

문자 = str(123456)
문자.길이 보여주기

sum([10, 20, 30]) 보여주기

리스트 = [3, 1, 2].정렬하기
리스트 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!

        assertEquals(result.reason, 'finish')
        assertEquals(lines[0], '4')
        assertEquals(lines[1], '6')
        assertEquals(lines[2], '6')
        assertEquals(lines[3], '60')
        assertEquals(lines[4], '[1, 2, 3]')
    },
})

Deno.test({
    name: 'Pyodide + 약속 interop: 복합 체인 (표준 람다 + Python map/sum + math alias)',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        const lines: string[] = []

        const session = new YaksokSession({
            stdout: (text) => {
                lines.push(text)
            },
        })

        const standard = new StandardExtension()
        await session.extend(standard)
        await session.setBaseContext(standard.manifest.module!['표준'])
        await session.extend(new Pyodide())

        session.addModule(
            'main',
            `원본 = [3, -2, 5, -1, 0]
양수만 = 원본.(람다 값: 값 > 0)로 거르기
양수만 보여주기

python절대합 = sum(list(map(abs, 원본)))
python절대합 보여주기

약속합 = 양수만.합계 구하기
약속합 보여주기

import math as m
round(m.sqrt(python절대합), 3) 보여주기

텍스트 = str(python절대합)
텍스트.길이 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!

        assertEquals(result.reason, 'finish')
        assertEquals(lines[0], '[3, 5]')
        assertEquals(lines[1], '11')
        assertEquals(lines[2], '8')
        assertEquals(lines[3], '3.317')
        assertEquals(lines[4], '2')
    },
})
