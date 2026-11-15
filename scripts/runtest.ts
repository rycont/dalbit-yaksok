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
        `만약 4 < 3 이면 # 주석
    "4는 3보다 크지" 보여주기
아니면 만약 1 == 2 이면
    "사실 그게 딱히 언제나 맞는 말은 아닌 것 같다는 의견도 존재해" 보여주기
아니면
    "세상에 진리란 없어" 보여주기
`,
    )
    .run()
