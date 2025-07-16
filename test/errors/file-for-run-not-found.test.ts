import { assert, assertIsError } from '@std/assert'
import { FileForRunNotExistError } from '../../core/error/prepare.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('없는 파일 실행 요청', async () => {
    const result = await yaksok({
        main: `@코레일 출발하기`,
    })

    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], FileForRunNotExistError)

    const result2 = await yaksok({
        코레일: `
요금계산표 = "없음"
            `,
    })

    assert(result2.reason === 'error')
    assertIsError(result2.error, FileForRunNotExistError)
})
