import { YaksokSession, Block, type Node } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

session.addModule(
    'main',
    `번역(JavaScript), (코드) 입력받기
***
    return eval(코드)
***
`,
)

session.stepUnit = Block

await session.runModule('main')
