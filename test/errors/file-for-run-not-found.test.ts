import { assert, assertIsError } from '@std/assert'
import { FileForRunNotExistError } from '../../core/error/prepare.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('없는 파일 실행 요청', async () => {
    const session = new YaksokSession()
    session.addModule('main', `@코레일 출발하기`)
    const result = (await session.runModule(['main'])).main

    assert(result.reason === 'validation')
    assertIsError(result.errors![0], FileForRunNotExistError)

    const session2 = new YaksokSession()
    session2.addModule(
        '코레일',
        `
요금계산표 = "없음"
            `,
    )
    const result2 = (await session2.runModule(['main'])).main

    assert(result2.reason === 'error')
    assertIsError(result2.errors?.[0], FileForRunNotExistError)
})
