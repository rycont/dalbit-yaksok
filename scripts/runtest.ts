import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'main',
        `번역(Runtime), (A)랄까 고민하기
`,
    )
    .run()
