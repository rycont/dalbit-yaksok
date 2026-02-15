import { YaksokSession, ListValue, StringValue, NumberValue } from './core/mod.ts'

const session = new YaksokSession({
    stdout: (msg) => console.log(msg),
})

const code = `
약속, (엘) 변경하기
    엘[0] = "바뀜"

목록 = ["원래", "값"]
(목록 변경하기)
목록 보여주기
`
session.addModule('main', code)
await session.runModule('main')
