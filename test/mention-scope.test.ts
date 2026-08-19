import { YaksokSession } from '@dalbit-yaksok/core'
import { assert } from '@std/assert'

Deno.test('MentionScope validate with invalid module', async () => {
    const session = new YaksokSession()

    session.addModule('main', `@없는모듈 변수`)

    const results = await session.runModule('main')
    const result = results.get('main')!
    // Should have error about module not found
    assert(
        result.reason === 'validation',
        `Expected error but got ${result.reason}`,
    )
})

Deno.test('MentionScope validate with module that has validation errors', async () => {
    const session = new YaksokSession()

    session.addModule('module', `변수 = 1`)
    session.addModule('main', `@module 변수`)

    const results = await session.runModule('main')
    const result = results.get('main')!
    // Should work fine with valid module
    assert(
        result.reason === 'finish',
        `Expected finish but got ${result.reason}`,
    )
})

Deno.test('MentionScope execute with non-YaksokError', async () => {
    const session = new YaksokSession()

    session.addModule('module', `변수 = 1`)
    session.addModule('main', `@module 변수`)

    const results = await session.runModule('main')
    const result = results.get('main')!
    assert(
        result.reason === 'finish',
        `Expected finish but got ${result.reason}`,
    )
})

Deno.test(
    'self-referential module does not infinitely recurse',
    async () => {
        // 모듈이 자기 이름을 @로 멘션하면(@자기참조) parse/validate가 같은 파일을
        // 다시 요구하며 무한재귀(RangeError)했다. 재진입 가드로 순환을 끊어,
        // 크래시 대신 정상적인 검증 오류로 종료되어야 한다. (runModule이 결과를
        // 반환한다는 것 자체가 무한재귀가 없었다는 증거)
        const session = new YaksokSession()

        session.addModule(
            '자기참조',
            [
                '약속, 인사',
                '    "안녕" 보여주기',
                '',
                '약속, 부르기',
                '    @자기참조 인사',
            ].join('\n'),
        )

        const results = await session.runModule('자기참조')
        const result = results.get('자기참조')!
        assert(
            result.reason === 'validation',
            `Expected graceful validation result but got ${result.reason}`,
        )
    },
)
