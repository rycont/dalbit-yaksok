import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session.extend({
    manifest: {
        ffiRunner: {
            runtimeName: 'mock',
        },
    },
    executeFFI() {
        return 'invalid value' as any
    },
    init() {
        return Promise.resolve()
    },
})

session.addModule(
    'main',
    `번역(mock), (질문) 물어보기
***
aasdf
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
)

const result = await session.runModule('main')
// console.log(result)
