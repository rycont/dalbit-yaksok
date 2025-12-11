import { dalbitToJS, YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

session.addModule(
    'main',
    `
이벤트(TEST_EVENT), 테스트 (A) 이벤트

테스트 "1" 이벤트
    "이벤트 1 실행됨" 보여주기

테스트 "2" 이벤트
    "이벤트 2 실행됨" 보여주기
`,
)

// Run the module. It should register the event listener.

session.eventCreation.sub('TEST_EVENT', (args, callback, terminate) => {
    if (dalbitToJS(args.A) === '1') {
        callback()
        terminate()
    }

    if (dalbitToJS(args.A) === '2') {
        setTimeout(() => {
            callback()
            terminate()
        }, 100)
    }
})

await session.runModule('main')