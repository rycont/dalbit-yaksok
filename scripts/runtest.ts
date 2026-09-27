import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule(
    'main',
    `
결과3 = 1 == 1 아니다
결과3 보여주기`,
)

await codeFile.run()
