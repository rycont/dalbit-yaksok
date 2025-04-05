import { CodeFile, yaksok } from '@dalbit-yaksok/core'

const baseContext: CodeFile = (
    await yaksok(`
약속, 지금/현재 시간 가져오기/말하기
    "그건 제가 도와드릴 수 없어요" 보여주기

약속, 지금/현재/지금의 밀리초 가져오기/말하기
    "그것도 제가 도와드릴 순 없어요.." 보여주기
`)
).codeFiles['main']

await yaksok(
    `지금 시간 가져오기
지금 시간 말하기
현재 시간 가져오기
현재 시간 말하기

지금 밀리초 가져오기
지금 밀리초 말하기
현재 밀리초 가져오기
현재 밀리초 말하기
지금의 밀리초 가져오기
지금의 밀리초 말하기`,
    {},
    baseContext,
)
