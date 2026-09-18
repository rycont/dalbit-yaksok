import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session.setBaseContext(
    `약속, (사람)을 칭찬하기
    사람 + " 최고" 보여주기`.trim(),
)

session.addModule(
    'main',
    `"인생이 뭐라고" 보여주기
"준희"을 칭찬하기`.trim(),
)

await session.runModule('main')
