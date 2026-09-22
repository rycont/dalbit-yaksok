import { assert, assertIsError } from '@std/assert'
import { YaksokSession } from '../../core/mod.ts'
import { CannotReturnOutsideFunctionError } from '../../core/error/index.ts'

Deno.test('약속의 밖에서는 `약속 그만`을 쓸 수 없음', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `"약속 밖에서는 약속을 멈출 수 없습니다" 보여주기
약속 그만`,
    )
    const result = (await session.runModule(['main'])).main

    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], CannotReturnOutsideFunctionError)
})
