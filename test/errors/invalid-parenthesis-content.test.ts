import { assertIsError, unreachable } from 'assert'

import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { ErrorGroups } from '../../core/error/validation.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('올바르지 않은 괄호 묶음', async () => {
    try {
        await yaksok(`(이고)`)
        unreachable()
    } catch (error) {
        assertIsError(error, ErrorGroups)
        for (const childError of error.errors.get('main')!) {
            assertIsError(childError, NotExecutableNodeError)
        }
    }
})
