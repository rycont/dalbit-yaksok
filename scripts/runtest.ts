import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule(
    'main',
    `
    이름 = '홍길동'
     나이 = 20
`,
)

await codeFile.run()
