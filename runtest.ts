import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession({
    stderr(message) {
        console.error(message)
    },
})
await session.extend(new QuickJS())
session.addModule(
    'main',
    `번역(QuickJS), (배열) 합치기
***
    return 배열.reduce((a, b) => a + b, "")
***

배열 = ["1", "2", "3"
배열 합치기 보여주기`,
)

const result = await session.runModule('main')
