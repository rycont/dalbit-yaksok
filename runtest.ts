import { dalbitToJS, YaksokSession } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const session = new YaksokSession()
await session.extend(new QuickJS())

session.addModule(
    'main',
    `
이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    "이벤트 실행됨" 보여주기
`,
)

// Run the module. It should register the event listener.
const result = session.runModule('main')

session.eventCreation.sub('TEST_EVENT', (args, callback, terminate) => {
    callback()
    callback()
    callback()

    terminate()
})

await result
