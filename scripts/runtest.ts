import { YaksokSession } from '@dalbit-yaksok/core'
import { math } from '@dalbit-yaksok/math'

const session = new YaksokSession()

await session.extend(math)

const codeFile = session.addModule(
    'main',
    `약속, (음식)을/를 (사람)와/과 먹기
    "맛있는 " + 음식 + ", " + 사람 + "의 입으로 모두 들어갑니다." 보여주기

먹을_음식 = "유부초밥"
먹일_사람 = "현수"

먹을_음식을 먹일_사람과 먹기

5번 반복
    또_다른_타겟 = "희준"
    먹을_음식을 또_다른_타겟과 먹기
`,
)

await codeFile.run()
