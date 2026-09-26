import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()
session.addModule(
    'main',
    `
1이름 = "홍길동",
1이름 보여주기`,
)
