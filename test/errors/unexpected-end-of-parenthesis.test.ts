import { assertIsError } from '@std/assert'
import { assert } from 'assert/assert'
import { UnexpectedEndOfCodeError } from '../../core/error/prepare.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('끝나지 못한 괄호', async () => {
    const result = await yaksok(`나이 = 10 + (20`)
    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], UnexpectedEndOfCodeError)
})
