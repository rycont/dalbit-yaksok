import { assert, assertIsError } from '@std/assert'

import { YaksokSession } from '../../core/mod.ts'
import { BreakNotInLoopError } from '../../core/error/index.ts'

Deno.test('반복의 밖에서는 `반복 그만`을 쓸 수 없음', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `"반복 밖에서는 반복을 멈출 수 없습니다" 보여주기
반복 그만`,
    )
    const result = (await session.runModules(['main'])).main

    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], BreakNotInLoopError)
})
