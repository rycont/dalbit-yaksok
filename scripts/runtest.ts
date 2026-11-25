import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        '아두이노',
        `약속, 이름
    "아두이노" / 2 반환하기
`,
    )
    .run()

await session.addModule('main', '(@아두이노 이름) 보여주기').run()
