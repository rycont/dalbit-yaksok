import { CodeFile, yaksok } from '@dalbit-yaksok/core'

const baseContext: CodeFile = (
    await yaksok(`
카운터 = 1

약속, 힘든 부탁 하기
    "그건 제가 도와드릴 수 없어요" 보여주기
    카운터 = 카운터 + 1
`)
).codeFiles['main']

await yaksok(`힘든 부탁 하기`, {}, baseContext)
await yaksok(`힘든 부탁 하기`, {}, baseContext)
await yaksok(
    `
"당신이 힘든 부탁을 한 횟수:" 보여주기
카운터 보여주기`,
    {},
    baseContext,
)
