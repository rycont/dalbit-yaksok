import { assert, assertIsError, unreachable } from '@std/assert'
import { FileForRunNotExistError } from '../../core/error/prepare.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('없는 파일 실행 요청', async () => {
    const result = await yaksok({
        main: `@코레일 출발하기`,
    })

    assert(result.reason === 'error')
    assertIsError(result.error, FileForRunNotExistError)

    try {
        await yaksok({
            코레일: `
    요금계산표 = "없음"
                `,
        })
        unreachable()
    } catch (e) {
        assertIsError(e, FileForRunNotExistError)
    }
})
