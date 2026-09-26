import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()
session.addModule(
    'main',
    `
이름 = '홍길동'
        나이 = 20
`,
)
