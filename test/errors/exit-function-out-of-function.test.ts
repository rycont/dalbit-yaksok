import { assertIsError, unreachable } from '@std/assert'
import { YaksokSession } from '../../core/mod.ts'
import { CannotReturnOutsideFunctionError } from '../../core/error/index.ts'

Deno.test('약속의 밖에서는 `약속 그만`을 쓸 수 없음', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `"약속 밖에서는 약속을 멈출 수 없습니다" 보여주기
약속 그만`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, CannotReturnOutsideFunctionError)
    }
})
