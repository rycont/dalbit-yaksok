import { YaksokSession } from '@dalbit-yaksok/core'
import { quickJS } from '@dalbit-yaksok/quickjs'
import functionStatement from '@dalbit-yaksok/statement-function'

const session = new YaksokSession()

await session.extend(await quickJS())
await session.extend(functionStatement)

await session
    .addModule(
        'main',
        `번역(QuickJS), 안녕 말하기
***
  return 10
***

안녕 말하기 보여주기
`,
    )
    .run()
