import { YaksokSession, Block, type Node } from '@dalbit-yaksok/core'

// const result = await yaksok(`정의 되지 않은 약속`)
const session = new YaksokSession({
    stdout: (text) => {
        console.log(text)
    },
    events: {
        runningCode: (start, end, scope, tokens) => {
            console.log(tokens.map((token) => token.value).join(' '))
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
    "수료증 출력 불가" 보여주기
나무=['은행나무','단풍나무','소나무']
나무[2] 보여주기
나무[0] = '잣나무'
간식 = 0
약속, 간식 (숫자)개 사기
    간식 = 500 * 숫자
    간식 + '원' 보여주기
간식 5개 사기
숫자 = 100
합 = 0
반복 1~숫자 의 수 마다
    만약 수 % 2 == 0 이면
        합 += 수
합 보여주기
숫자1 = 55000
숫자2 = 15
가격 = 숫자1 * 숫자2
만약 숫자2 == 2 이면
    가격 * 0.98 보여주기
아니면 만약 숫자2 == 3 이면
    가격 * 0.95 보여주기
아니면 만약 숫자2 >= 4 이면
    가격 * 0.9 보여주기`,
)

session.stepUnit = Block

await session.runModule('main')
