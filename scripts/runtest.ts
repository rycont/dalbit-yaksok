import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'var',
        `이름 = "길동"
이름 보여주기`,
    )
    .run()

await session
    .addModule(
        'main',
        `약속, 이동하기(가로, 세로, 높이)
    가로 + " x " + 세로 보여주기

이동하기(1, 2, 3)`,
    )
    .run()
