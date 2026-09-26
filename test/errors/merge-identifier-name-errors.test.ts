import {
    NotDefinedIdentifierError,
    YaksokError,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { assert } from '@std/assert'

Deno.test('Merge identifier name errors', async () => {
    const errors: YaksokError[] = []

    const session = new YaksokSession({
        stderr: (_, error) => {
            errors.push(error)
        },
    })

    session.addModule('main', `정의 되지 않은 약속`)

    assert(errors.length === 1)

    const [error] = errors

    assert(error instanceof NotDefinedIdentifierError)
    assert(error.resource.name === '정의 되지 않은 약속')
})
