import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'main',
        `결과1 = 참 아니다
결과2 = 거짓 아니다
결과3 = 1 == 1 아니다
불리언 = 참
결과4 = 불리언 아니다`,
    )
    .run()
