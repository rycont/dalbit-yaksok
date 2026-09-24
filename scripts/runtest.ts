import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

await session
    .addModule(
        'main',
        `
번역(QuickJS), (par)에 (target)이 포함
***
return par.includes(target)
***

결과 = "안녕하세요"에 "안녕"이 포함
결과 보여주기
`,
    )
    .run()
