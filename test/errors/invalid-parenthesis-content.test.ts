import { assert, assertIsError } from 'assert'

import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { ErrorGroups } from '../../core/error/validation.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('올바르지 않은 괄호 묶음', async () => {
    const result = await yaksok(`(이고)`)
    assert(result.reason === 'error', `Expected an error, but got ${result.reason}`)
    assertIsError(result.error, ErrorGroups)
    for (const childError of result.error.errors.get('main')!) {
        assertIsError(childError, NotExecutableNodeError)
    }
})
