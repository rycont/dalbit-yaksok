import { YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession({
    stderr: (message) => console.error(message),
})

await session.extend(new QuickJS())

session.addModule(
    'main',
    `번역(QuickJS), 길이
***
return 리스트.length
***`,
)

await session.runModule('main')
