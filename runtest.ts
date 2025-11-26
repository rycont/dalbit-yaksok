import { YaksokSession, Block } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

session.addModule(
    'main',
    `1이름 = "홍길동",
하랑봇 오른쪽으로 일보 가 보여주기`,
)

session.stepUnit = Block

await session.runModule('main')
