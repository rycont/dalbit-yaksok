import { YaksokSession } from '@dalbit-yaksok/core'

// const result = await yaksok(`정의 되지 않은 약속`)
const session = new YaksokSession({
    stdout: (text) => {
        console.log(text)
    },
})

session.addModule('main', `정의 되지 않은 약속`)
await session.runModule('main')
