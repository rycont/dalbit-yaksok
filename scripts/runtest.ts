import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'
import { StatisticsExtension } from '@dalbit-yaksok/statistics'

const session = new YaksokSession()
await session.extend(
    new QuickJS({
        prompt: () => {
            return '10'
        },
    }),
)

await session.extend(new StatisticsExtension())

session.addModule(
    'main',
    `데이터 = [2, 4, 4, 4, 5, 5, 7, 9]
평균값 = @통계 (데이터)의 평균
표준편차값 = @통계 (데이터)의 표준편차
정규화 = (7 - 평균값) / 표준편차값
정규화 보여주기
`,
)

await session.runModule('main')

// console
