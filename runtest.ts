import { yaksok } from '@dalbit-yaksok/core'

await yaksok({
    아두이노: `
약속, 이름
    결과: "아두이노" / 2
`,
    main: '(@아두이노 이름) 보여주기',
})
