import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    stderr: (message) => console.error(message),
})

session.addModule('main', `
약속, (x, y) 이동하기
    (x + 10, y + 10) 반환하기

현재_위치 = (0, 0)
다음_위치 = 이동하기(현재_위치[0], 현재_위치[1])
다음_위치 보여주기`)

const result = await session.runModule('main')
// console.log(result.get("main"))
