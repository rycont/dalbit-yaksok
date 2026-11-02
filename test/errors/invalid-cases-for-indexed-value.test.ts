import {
    ListIndexTypeError,
    TupleNotMutableError,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('Tuple is immutable - cannot set value by index', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
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
    expect.assert.instanceOf(errors[0], TupleNotMutableError)
})

test('Key for list fancy indexing is not a number', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
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
    expect.assert.instanceOf(errors[0], ListIndexTypeError)
})
