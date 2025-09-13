import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: pandas Series sum/mean',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        let output = ''

        const session = new YaksokSession({
            stdout: (text) => {
                output += (output ? '\n' : '') + text
            },
        })

        await session.extend(new Pyodide(['pandas']))

        session.addModule(
            'main',
            `from pandas import Series
s = Series([1, 2, 3])
s 보여주기
s.sum() 보여주기
s.mean() 보여주기`,
        )

        const result = await session.runModule('main')
        assertEquals(result.reason, 'finish')

        const lines = output.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
        // 숫자만 추출 (pandas Series 문자열 출력 라인 제외)
        const numericLines = lines.filter((l) => /^-?\d+(?:\.\d+)?$/.test(l))
        assertEquals(numericLines.length >= 2, true)

        const sumVal = Number(numericLines[0])
        const meanVal = Number(numericLines[1])
        assertEquals(sumVal, 6)
        assertEquals(meanVal, 2)
    },
})


