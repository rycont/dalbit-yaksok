import { YaksokSession, Block, type Node } from '@dalbit-yaksok/core'

// const result = await yaksok(`정의 되지 않은 약속`)
const session = new YaksokSession({
    stdout: (text) => {
        console.log(text)
    },
    events: {
        runningCode: (start, end, scope, tokens) => {
            console.log(
                start.line,
                tokens.map((token) => token.value).join(' '),
            )
        },
    },
})

session.addModule(
    'main',
    `10*5 보여주기
11**3 보여주기
ㄱ = 6
ㄴ = 10
ㄱ - ㄴ 보여주기
ㄱ = 60
ㄴ = 5
ㄱ // ㄴ 보여주기
출석횟수 = 30
만약 출석횟수 >= 20 이면
    "수료증 출력" 보여주기
아니면
    "수료증 출력 불가" 보여주기`,
)

session.stepUnit = Block

await session.runModule('main')
