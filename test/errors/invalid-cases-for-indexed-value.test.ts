import {
    ListIndexTypeError,
    TupleNotMutableError,
    YaksokSession,
} from '../../core/mod.ts'
import { assertIsError, unreachable } from '@std/assert'

Deno.test('Tuple is immutable - cannot set value by index', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `
튜플 = (1, 2, 3)
튜플[0] = 10`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, TupleNotMutableError)
    }
})

Deno.test('Key for list fancy indexing is not a number', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `
목록 = [1, 2, 3]
목록[[2, "a"]] 보여주기`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, ListIndexTypeError)
    }
})
