import { YaksokSession } from '@dalbit-yaksok/core'

// const result = await yaksok(`정의 되지 않은 약속`)
const session = new YaksokSession({
    stdout: (text) => {
        console.log(text)
    },
})

session.addModule(
    'main',
    `
약속, (사람)이 (메시지)라고 인사하기
    "[SYSTEM] " + 사람 + "가 인사합니다: " + 메시지 보여주기

약속, 이름이 (이름)이오 나이가 (나이)이라고/라고 말하기
    이름이 "내 나이는 " + 나이라고 인사하기

내_이름 = "김수한무거북이와두루미"
내_나이 = "삼천갑자"

이름이 내_이름이오 나이가 내_나이라고 말하기
`,
)
await session.runModule('main')
