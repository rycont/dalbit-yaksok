import { assert, assertIsError } from '@std/assert'

import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('올바르지 않은 괄호 묶음', async () => {
    const session = new YaksokSession()
    session.addModule('main', `(이고)`)
    const result = (await session.runModule(['main'])).main
    assert(
        result.reason === 'validation',
        `Expected an validation, but got ${result.reason}`,
    )

    for (const childError of result.errors!) {
        assertIsError(childError, NotExecutableNodeError)
    }
})
