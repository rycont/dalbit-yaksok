import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule(
    'main',
    `
배열 = [5, 3, 8, 1]
반복 0
    만약 배열[i] > 배열[i + 1] 이면
        '악' 보여주기`,
)

await codeFile.run()
