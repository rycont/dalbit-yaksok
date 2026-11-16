import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'main',
        `약속, 이동하기(가로, 세로)
    가로 보여주기

이동하기
    가로: 1
    세루: 2`,
    )
    .run()
