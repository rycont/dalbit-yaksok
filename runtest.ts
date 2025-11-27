import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.addModule('main', `번역 이라고 할 뻔 했지만 사실 번역이 아니라는거`)

await session.runModule('main')
