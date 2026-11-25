import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.useBaseFrame(await session.addModule('base', '값 = 5').run())

const codeFile = session.addModule('main', '결과 = 값 + 10\n결과 보여주기')
await codeFile.run()
