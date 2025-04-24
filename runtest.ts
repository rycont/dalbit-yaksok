import { yaksok } from '@dalbit-yaksok/core'

await yaksok({
    하랑봇: `
약속, (내용) 말하기
    내용 + "? 어쩌라고." 보여주기

날씨 = "비"
`,
    main: `
할말 = "뭐라고"
@하랑봇 (@하랑봇 날씨) 말하기
`,
})
