import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

const codeFile = session.addModule('main', `번역(Runtime),`)

await codeFile.run()
