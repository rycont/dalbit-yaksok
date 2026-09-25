import { YaksokSession } from '@dalbit-yaksok/core'
import { StatisticsExtension } from '@dalbit-yaksok/statistics'

const session = new YaksokSession()

await session.extend(new StatisticsExtension())

await session
    .addModule('장치', `만약 이상한거 모름 이면\n    "body" 보여주기`)
    .run()
