import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()
session.addModule(
    'main',
    `나이 = (정의 되지 않은 약속) + 20 + 3 + (이름이 없는)`,
)
