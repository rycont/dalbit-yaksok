import { assert, assertIsError } from 'assert'

import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('올바르지 않은 괄호 묶음', async () => {
    const result = await yaksok(`(이고)`)
    assert(
        result.reason === 'validation',
        `Expected an validation, but got ${result.reason}`,
    )

    for (const childError of result.errors.get('main')!) {
        assertIsError(childError, NotExecutableNodeError)
    }
})
