import {
    ListIndexTypeError,
    TupleNotMutableError,
    yaksok,
} from '../../core/mod.ts'
import { assert, assertIsError } from '@std/assert'

Deno.test('Tuple is immutable - cannot set value by index', async () => {
    const result = await yaksok(`
튜플 = (1, 2, 3)
튜플[0] = 10`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, TupleNotMutableError)
})

Deno.test('Key for list fancy indexing is not a number', async () => {
    const result = await yaksok(`
목록 = [1, 2, 3]
목록[[2, "a"]] 보여주기`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, ListIndexTypeError)
})
