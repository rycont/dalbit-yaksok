import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    stderr: (message) => console.error(message),
})

session.addModule('main', `멍멍*이 = 10`)

const result = await session.runModule('main')
// console.log(result.get("main"))
