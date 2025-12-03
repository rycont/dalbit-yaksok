import { YaksokSession } from '../core/mod.ts'
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
    const runPromise = session.runModule('main')

    // Wait for listener registration
    while (session.aliveListeners.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10))
    }

    // Trigger the event from outside
    session.eventPubsub.pub('TEST_EVENT', [])

    // Trigger again
    session.eventPubsub.pub('TEST_EVENT', [])

    // End the event to finish execution
    session.eventEndPubsub.pub('TEST_EVENT', [])

    await runPromise

    assertEquals(output, '이벤트 실행됨\n이벤트 실행됨\n')
})

Deno.test('여러 이벤트 구독', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
이벤트(EVENT_A), A 이벤트
이벤트(EVENT_B), B 이벤트

A 이벤트
    "A 실행" 보여주기

B 이벤트
    "B 실행" 보여주기
`,
    )

    const runPromise = session.runModule('main')

    // Wait for listener registration (we expect 2 listeners)
    while (session.aliveListeners.length < 2) {
        await new Promise((resolve) => setTimeout(resolve, 10))
    }

    session.eventPubsub.pub('EVENT_A', [])
    session.eventPubsub.pub('EVENT_B', [])
    session.eventPubsub.pub('EVENT_A', [])

    session.eventEndPubsub.pub('EVENT_A', [])
    session.eventEndPubsub.pub('EVENT_B', [])

    await runPromise

    assertEquals(output, 'A 실행\nB 실행\nA 실행\n')
})
