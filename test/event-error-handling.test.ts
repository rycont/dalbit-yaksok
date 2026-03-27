import { YaksokSession } from '../core/mod.ts'
import { assert } from '@std/assert'

Deno.test('이벤트 내부에서 발생한 오류가 stderr로 전달된다', async () => {
    let stderrCalled = false
    const session = new YaksokSession({
        stderr() {
            stderrCalled = true
        },
    })

    session.addModule(
        'main',
        `
이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    없는변수 보여주기
`,
    )

    session.eventCreation.sub('TEST_EVENT', (_, callback, terminate) => {
        callback()
        terminate()
    })

    await session.runModule('main')

    assert(stderrCalled, '이벤트 내부 오류가 stderr로 보고되어야 한다')
})

Deno.test({
    name: '이벤트 내부에서 오류가 발생해도 runModule이 hang하지 않는다',
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        const session = new YaksokSession({
            stderr() {},
        })

        session.addModule(
            'main',
            `
이벤트(TEST_EVENT), 테스트 이벤트

테스트 이벤트
    없는변수 보여주기
`,
        )

        session.eventCreation.sub('TEST_EVENT', (_, callback, _terminate) => {
            callback()
            // terminate()를 호출하지 않음 — 에러 시 내부적으로 terminate 되어야 함
        })

        const timer = setTimeout(() => {
            throw new Error('runModule이 3초 내에 완료되지 않았다 (hang)')
        }, 3000)

        await session.runModule('main')
        clearTimeout(timer)
    },
})
