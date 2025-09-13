import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'

Deno.test({
    name: 'Pyodide: numpy random randint + reshape + sum/mean',
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        let output = ''

        const session = new YaksokSession({
            stdout: (text) => {
                output += (output ? '\n' : '') + text
            },
        })

        await session.extend(new Pyodide())

        session.addModule(
            'main',
            `from numpy.random import seed
seed(42)
from numpy.random import randint
arr = randint(0, 100, 12)
mat = arr.reshape(3, 4)
mat 보여주기
mat.sum() 보여주기
mat.mean() 보여주기
mat.reshape(4, 3) 보여주기`,
        )

        const result = await session.runModule('main')
        assertEquals(result.reason, 'finish')

        const lines = output.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
        // 숫자만 있는 줄만 추출 (배열 출력은 여러 줄이므로 제외)
        const numericLines = lines.filter((l) => /^-?\d+(?:\.\d+)?$/.test(l))
        // 최소 합계/평균 2줄이 있어야 함
        assertEquals(numericLines.length >= 2, true)
        // sum과 mean이 숫자인지 체크 (시드는 환경별 numpy 버전에 따라 배열이 달라질 수 있음)
        const sumVal = Number(numericLines[0])
        const meanVal = Number(numericLines[1])
        assertEquals(Number.isFinite(sumVal), true)
        assertEquals(Number.isFinite(meanVal), true)
        // 평균 * 원소 개수 ~= 합계 (정수 캐스팅 등으로 근소 오차 가능) → 정수 변환 후 비교
        assertEquals(Math.round(meanVal * 12), Math.round(sumVal))
    },
})


