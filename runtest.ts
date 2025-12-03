import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

session.addModule('time', '이벤트(TICK), 매 초 실행하기')

session.addModule(
    'main',
    `
@time 매 초 실행하기
    '어서오세요' 보여주기`,
)

let count = 0

const interval = setInterval(() => {
    session.eventPubsub.pub('TICK', [])
    count++
    if (count === 5) {
        clearInterval(interval)
        session.eventEndPubsub.pub('TICK', [])
    }
}, 1000)

await session.runModule('main')
