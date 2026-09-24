import {
    ListIndexTypeError,
    TupleNotMutableError,
    YaksokSession,
} from '../../core/mod.ts'
import { assert, assertIsError } from '@std/assert'

Deno.test('Tuple is immutable - cannot set value by index', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
튜플 = (1, 2, 3)
튜플[0] = 10`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], TupleNotMutableError)
})

Deno.test('Key for list fancy indexing is not a number', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
목록 = [1, 2, 3]
목록[[2, "a"]] 보여주기`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], ListIndexTypeError)
})
