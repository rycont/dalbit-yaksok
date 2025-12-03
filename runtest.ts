import { YaksokSession, Block, type Node } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

session.setBaseContext('이벤트(REPEAT_EVERY_T), (t)초에 한번 실행하기')

session.addModule(
    'main',
    `
3초에 한번 실행하기
    '으악!' 보여주기`,
)

let count = 0

const interval = setInterval(() => {
    session.eventPubsub.pub('REPEAT_EVERY_T', [])
    count++
    if (count === 5) {
        clearInterval(interval)
        session.eventEndPubsub.pub('REPEAT_EVERY_T', [])
    }
}, 1000)

await session.runModule('main')
