import { QuickJS } from '@dalbit-yaksok/quickjs'
import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from '@std/assert'

let output = ''
const session = new YaksokSession({
    stdout(value) {
        console.log(value)
        output += value + '\n'
    },
})

await session.extend(
    new QuickJS({
        prompt: () => {
            return '10'
        },
    }),
)

session.addModule(
    'main',
    `
번역(QuickJS), (질문) 물어보기
***
    return prompt()
***

번역(QuickJS), (문자)를 숫자로 바꾸기
***
    return parseInt(문자, 10)
***

번역(QuickJS), (최소)와 (최대) 사이의 랜덤한 수
***
    return 7
***

먹고싶은_사과_수 = (("사과 몇 개 먹고 싶어요?") 물어보기)를 숫자로 바꾸기
덤_사과_수 = (1)와 (10) 사이의 랜덤한 수

먹고싶은_사과_수 + "개는 너무 적으니, " + 덤_사과_수 + "개 더 먹어서 " + (먹고싶은_사과_수 + 덤_사과_수) + "개 먹어야 겠어요." 보여주기
`,
)

await session.runModule('main')

assertEquals(output, '10개는 너무 적으니, 7개 더 먹어서 17개 먹어야 겠어요.\n')
