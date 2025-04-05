import { CodeFile, yaksok } from '@dalbit-yaksok/core'

const baseCode = `
약속, 힘든 부탁 하기
    "그건 제가 도와드릴 수 없어요" 보여주기
`

const baseContext: CodeFile = (await yaksok(baseCode)).codeFiles['main']

await yaksok(`힘든 부탁 하기`, {}, baseContext)
