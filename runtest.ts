import { yaksok } from '@dalbit-yaksok/core'

await yaksok(
    `
10 != 20 보여주기
!(10 == 20) 보여주기

만약 !(1 == 20) 이면
    "당연히 1은 20과 같지 않습니다." 보여주기
`,
)
