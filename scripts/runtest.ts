import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule(
    'main',
    `번역(QuickJS), 에러 발생
***
    throw new Error('QuickJS Error')
***

에러 발생
`,
)

await codeFile.run()
