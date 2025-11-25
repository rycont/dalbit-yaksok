import { YaksokSession, Block, type Node } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

session.addModule(
    'main',
    `만약 N = 10
    N 보여주기`,
)

session.stepUnit = Block

await session.runModule('main')
