import { assertIsError, unreachable } from 'assert'

import { yaksok } from '../../core/mod.ts'
import { BreakNotInLoopError } from '../../core/error/index.ts'

Deno.test('반복의 밖에서는 `반복 그만`을 쓸 수 없음', async () => {
    try {
        await yaksok(`"반복 밖에서는 반복을 멈출 수 없습니다" 보여주기
반복 그만`)

        unreachable()
    } catch (error) {
        assertIsError(error, BreakNotInLoopError)
    }
})
