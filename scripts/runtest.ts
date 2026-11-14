import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session.extend({
    capabilties: {
        FFI: [
            {
                runtimeId: 'mock',
                run: () => undefined as any,
            },
        ],
    },
})

await session
    .addModule(
        'main',
        `번역(mock), (질문) 물어보기
***
CODES
***
(("이름이 뭐에요?") 물어보기) 보여주기`,
    )
    .run()
