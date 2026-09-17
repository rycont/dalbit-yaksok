import { YaksokSession } from '@dalbit-yaksok/core'
import { MathExtension } from '@dalbit-yaksok/math'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession({
    stderr: (message) => console.error(message),
})

await session.extend(new MathExtension())
await session.extend(new QuickJS())

const codeFile = session.addModule('main', `@수학 (-5)의 절댓값`)
// console.log(codeFile.ast.subnode)

await session.runModule('main')

// console

// 약속, (음식)을/를 (사람)와/과 먹기
//     "맛있는 " + 음식 + ", " + 사람 + "의 입으로 모두 들어갑니다." 보여주기

// 먹을_음식 = "유부초밥"
// 먹일_사람 = "현수"

// 먹을_음식을 먹일_사람과 먹기
