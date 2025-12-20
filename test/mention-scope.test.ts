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

Deno.test(
    'MentionScope validate with module that has validation errors',
    async () => {
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
    },
)

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
