import { YaksokSession } from '@dalbit-yaksok/core'
import { statistics } from '@dalbit-yaksok/statistics'

const session = new YaksokSession()

await session.extend(statistics)

await session.addModule('main', `(@통계 [1, 2, 3, 4, 5]의 합계) 보여주기`).run()
