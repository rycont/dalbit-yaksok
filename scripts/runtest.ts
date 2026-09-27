import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule(
    'main',
    `약속, 이동하기(가로?, 세로)\n    세로 보여주기\n\n이동하기\n    세로: 2`,
)

await codeFile.run()
