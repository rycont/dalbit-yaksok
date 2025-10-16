import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    stderr: (human, machine) => {
        console.error('[Human Readable]')
        console.error(human)
        console.error('\n[Machine Readable (as Object)]')
        console.error(JSON.stringify(machine, null, 2))
    },
})

// 정의되지 않은 변수 사용으로 에러 발생시키기
session.addModule('main', '정의되지않은변수 보여주기')
await session.runModule('main')
