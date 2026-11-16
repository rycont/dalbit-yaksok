import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'main',
        `
반복
    "Hello, world!" * "Hello, world!" 보여주기
    반복 그만
`,
    )
    .run()
