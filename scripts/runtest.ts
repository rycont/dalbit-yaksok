import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'var',
        `이름 = "길동"
이름 보여주기
[10, 20, 30]의 숫자 마다 반복
    숫자 보여주기`,
    )
    .run()

await session.addModule('main', `@var 이름 보여주기`).run()
