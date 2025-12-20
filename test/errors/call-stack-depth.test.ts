import { assert, assertEquals, assertIsError } from '@std/assert'

import { CallStackDepthExceededError } from '../../core/error/index.ts'
import { yaksok } from '../../core/mod.ts'
import { YaksokSession } from '../../core/session/session.ts'
import { FEATURE_FLAG } from '../../core/constant/feature-flags.ts'

const recursiveProgram = (invokeDepth: number) => `
약속, 재귀 (단계)
    만약 단계 <= 1 이면
        약속 그만
    재귀 (단계 - 1)

재귀 ${invokeDepth}
`

// 기본 재귀 테스트들
Deno.test('call stack depth limit allows 32 levels of recursion', async () => {
    const result = await yaksok(recursiveProgram(32))

    assertEquals(result.reason, 'finish')
})

Deno.test(
    'call stack depth limit throws when exceeding 32 levels of recursion',
    async () => {
        const result = await yaksok(recursiveProgram(33))

        assert(
            result.reason === 'error',
            `Expected error, but got ${result.reason}`,
        )
        assertIsError(result.error, CallStackDepthExceededError)
    },
)

// FEATURE FLAG 테스트 (가장 중요한 기능 테스트)
Deno.test(
    'call stack depth limit can be disabled with FEATURE_FLAG',
    async () => {
        const session = new YaksokSession({
            flags: {
                [FEATURE_FLAG.DISABLE_CALL_STACK_DEPTH_LIMIT]: true,
            },
        })

        session.addModule('main', recursiveProgram(33))
        const results = await session.runModule('main')
        const result = results.get('main')!

        assertEquals(
            result.reason,
            'finish',
            'Expected execution to finish when flag is disabled',
        )
    },
)

Deno.test(
    'call stack depth limit still works when FEATURE_FLAG is not set',
    async () => {
        const session = new YaksokSession({
            flags: {},
        })

        session.addModule('main', recursiveProgram(33))
        const results = await session.runModule('main')
        const result = results.get('main')!

        assert(
            result.reason === 'error',
            `Expected error, but got ${result.reason}`,
        )
        assertIsError(result.error, CallStackDepthExceededError)
    },
)
