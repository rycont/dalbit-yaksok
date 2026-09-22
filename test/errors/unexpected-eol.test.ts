import { assert, assertIsError } from '@std/assert'
import {
    UnexpectedEndOfCodeError,
    UnexpectedNewlineError,
} from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('예상치 못한 줄바꿈', async () => {
    const session = new YaksokSession()
    session.addModule('main', `약속, (A)와 (B)를`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedEndOfCodeError)
})

Deno.test('문자열 내 줄바꿈', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `"줄바꿈이
있는 문자열"`,
    )
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedNewlineError)
})
