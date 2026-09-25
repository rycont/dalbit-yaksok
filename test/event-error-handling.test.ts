import { YaksokSession } from '../core/mod.ts'
import { assert } from '@std/assert'

Deno.test('이벤트 내부에서 발생한 오류가 stderr로 전달된다', async () => {
    let stderrCalled = false
    const session = new YaksokSession({
        stderr() {
            stderrCalled = true
        },
    })

    const codeFile = session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    "이" / 0 보여주기
`,
    )

    session.eventCreation.sub('TEST_EVENT', async (_, callback, terminate) => {
        await callback()
        terminate()
    })

    await codeFile.run()

    assert(stderrCalled, '이벤트 내부 오류가 stderr로 보고되어야 한다')
})

Deno.test({
    name: '이벤트 내부에서 오류가 발생하면 실행이 종료된다.',
    timeout: 500,
    async fn() {
        const session = new YaksokSession({
            stderr() {},
        })

        const codeFile = session.addModule(
            'main',
            `
이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    "이" / 0 보여주기
`,
        )

        session.eventCreation.sub('TEST_EVENT', (_, callback, _terminate) => {
            callback()
        })

        await codeFile.run()
    },
})
