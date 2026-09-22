import { assertIsError } from '@std/assert'
import { assert } from 'assert/assert'
import { UnexpectedEndOfCodeError } from '../../core/error/prepare.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('끝나지 못한 괄호', async () => {
    const session = new YaksokSession()
    session.addModule('main', `나이 = 10 + (20`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedEndOfCodeError)
})
