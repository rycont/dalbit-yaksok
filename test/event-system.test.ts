import { dalbitToJS, YaksokSession } from '../core/mod.ts'
import { assertEquals } from '@std/assert'

Deno.test('이벤트 구독 및 실행', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    "이벤트 실행됨" 보여주기
`,
    )

    // Run the module. It should register the event listener.

    session.eventCreation.sub('TEST_EVENT', (_, callback, terminate) => {
        callback()
        callback()
        callback()

        terminate()
    })

    await session.runModule('main')

    assertEquals(output, '이벤트 실행됨\n이벤트 실행됨\n이벤트 실행됨\n')
})

Deno.test('여러 이벤트 구독 및 실행', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

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

    assertEquals(output, '이벤트 1 실행됨\n이벤트 2 실행됨\n')
})
