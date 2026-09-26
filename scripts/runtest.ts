import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

await session
    .addModule(
        'main',
        `황산_아이큐 = 150    # 내 아이큐 150.
        교강용_아이큐 = 150  # 네 아이큐 150.
`,
    )
    .run()
