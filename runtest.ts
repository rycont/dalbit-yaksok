import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    stdout: (text) => console.log(text),
    stderr: (text) => console.error(text),
})

session.addModule('main', `없는 변수 출력 보여주기`)

await session.runModule('main')
