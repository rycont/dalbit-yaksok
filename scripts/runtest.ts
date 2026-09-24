import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        '장치',
        `약속, 이동하기(가로, 세로)
    "{가로},{세로}" 보여주기

약속, 설정하기(밝기, 소리?)
    소리 보여주기
`,
    )
    .run()

const codeFile = session.addModule('main', `@장치 이동하기(1, 2, 3)`)

// await codeFile.run()
