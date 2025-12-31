import { assert, assertIsError } from '@std/assert'
import { yaksok } from '../../core/mod.ts'
import { CannotReturnOutsideFunctionError } from '../../core/error/index.ts'

Deno.test('약속의 밖에서는 `약속 그만`을 쓸 수 없음', async () => {
    const result = await yaksok(`"약속 밖에서는 약속을 멈출 수 없습니다" 보여주기
약속 그만`)

    assert(result.reason === 'error', `Expected an error, but got ${result.reason}`)
    assertIsError(result.error, CannotReturnOutsideFunctionError)
})

