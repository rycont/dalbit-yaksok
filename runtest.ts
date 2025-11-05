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
약속, (음식)을/를 (사람)와/과 먹기
    "맛있는 " + 음식 + ", " + 사람 + "의 입으로 모두 들어갑니다." 보여주기

먹을_음식 = "유부초밥"
먹일_사람 = "현수"

먹을_음식을 먹일_사람과 먹기

5번 반복
    먹을_음식을 먹일_사람과 먹기
`,
)
await session.runModule('main')
