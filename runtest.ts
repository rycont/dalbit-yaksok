import { yaksok } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const quickjs = new QuickJS({
    prompt,
})

await quickjs.init()

await yaksok(
    `
번역(JavaScript), (arr) (n)번째 값 제거
***
return [...arr.slice(0, n), ...arr.slice(n + 1)];
***

배열 = [1, 2, 3, 4, 5]
배열 보여주기
배열[2] 보여주기

삭제된거 = 배열 2번째 값 제거
삭제된거 보여주기
삭제된거[2] 보여주기
배열 보여주기
`,
    {
        runFFI(_, code, args) {
            return quickjs.run(code, args)
        },
    },
)
