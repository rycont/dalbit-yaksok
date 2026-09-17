import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

// Base context with a variable
await session.setBaseContext(`값 = 42`)

// Module with a function using postposition
session.addModule(
    '도구',
    `약속, (데이터)로 출력하기
    데이터 보여주기`,
)

// Main uses @mention with the base context variable + postposition
session.addModule(
    'main',
    `약속, (음식)을/를 (사람)와/과 먹기
    "맛있는 " + 음식 + ", " + 사람 + "의 입으로 모두 들어갑니다." 보여주기

먹을_음식 = "유부초밥"
먹일_사람 = "현수"

먹을_음식을 먹일_사람과 먹기`,
)

await session.runModule('main')

// console
