import { yaksok } from '../../core/mod.ts'
import { assertIsError } from '@std/assert'
import { FileForRunNotExistError } from '../../core/error/prepare.ts'

Deno.test('없는 파일 실행 요청', async () => {
    try {
        await yaksok({
            main: `@코레일 출발하기`,
        })
    } catch (e) {
        assertIsError(e, FileForRunNotExistError)
    }

    try {
        await yaksok({
            코레일: `
요금계산표 = "없음"
            `,
        })
    } catch (e) {
        assertIsError(e, FileForRunNotExistError)
    }
})
