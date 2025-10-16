import { FEATURE_FLAG, YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    flags: {
        [FEATURE_FLAG.MACHINE_READABLE_ERROR]: true,
    },
})

// 정의되지 않은 변수 사용으로 에러 발생시키기
session.addModule('main', '정의되지않은변수 보여주기')
await session.runModule('main')
