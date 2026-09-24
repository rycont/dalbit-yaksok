import {
    ListIndexTypeError,
    TupleNotMutableError,
    YaksokSession,
} from '../../core/mod.ts'
import { assertIsError } from '@std/assert'

Deno.test('Tuple is immutable - cannot set value by index', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, _machineReadable, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `
튜플 = (1, 2, 3)
튜플[0] = 10`,
    )
    await codeFile.run()
    assertIsError(errors[0], TupleNotMutableError)
})

Deno.test('Key for list fancy indexing is not a number', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, _machineReadable, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `
목록 = [1, 2, 3]
목록[[2, "a"]] 보여주기`,
    )
    await codeFile.run()
    assertIsError(errors[0], ListIndexTypeError)
})
