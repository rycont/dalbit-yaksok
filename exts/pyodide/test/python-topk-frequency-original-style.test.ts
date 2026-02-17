import { YaksokSession } from '@dalbit-yaksok/core'
import { Pyodide } from '@dalbit-yaksok/pyodide'
import { assertEquals } from '@std/assert'
import { StandardExtension } from '../../standard/mod.ts'

Deno.test({
    name: 'Pyodide: import module + dotted access + most_common + 표준 map',
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
            `import collections
import itertools

약속, (중첩목록)에서 상위 (K)개 빈도 찾기
    평탄화 = list(itertools.chain.from_iterable(중첩목록))
    빈도표 = collections.Counter(평탄화)
    가장흔한것들 = 빈도표.most_common(K)
    (가장흔한것들 . (람다 항목: 항목[0]) 로 변환하기) 반환하기

목록 = [[1, 2, 6], [1, 3, 4, 5, 7, 8], [1, 3, 5, 6, 8, 9], [2, 5, 7, 11], [1, 4, 7, 8, 12]]
(목록에서 상위 3개 빈도 찾기) 보여주기
(목록에서 상위 1개 빈도 찾기) 보여주기
(목록에서 상위 5개 빈도 찾기) 보여주기`,
        )

        const results = await session.runModule('main')
        const result = results.get('main')!

        assertEquals(result.reason, 'finish')
        assertEquals(lines[0], '[1, 5, 7]')
        assertEquals(lines[1], '[1]')
        assertEquals(lines[2], '[1, 5, 7, 8, 2]')
    },
})
