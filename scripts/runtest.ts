import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()

await session.extend(new QuickJS())

await session
    .addModule(
        'main',
        `약속, 이동하기(가로, 세로)
    "{가로},{세로}" 보여주기

이동하기(1, 2)`,
    )
    .run()
