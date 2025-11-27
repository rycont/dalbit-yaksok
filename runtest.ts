import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.addModule(
    'main',
    `
이름 = "홍길동"이라고 할 뻔,
`,
)

await session.runModule('main')
