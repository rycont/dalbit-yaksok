import { YaksokSession } from '@dalbit-yaksok/core'

await new YaksokSession()
    .addModule(
        'main',
        `약속, 이동하기(가로, 세로)
    "{가로},{세로}" 보여주기

이동하기(1, 2)`,
    )
    .run()
