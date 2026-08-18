import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    stderr: (message) => console.error(message),
})

session.addModule(
    'main',
    `
약속, 물어보기(이름?, 나이?)
    "{이름}이는 {나이}살이 맞아?" 보여주기

물어보기
    이름: "이진"
    나이: 3`,
)

await session.runModule('main')
