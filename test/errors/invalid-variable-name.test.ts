import { YaksokSession } from '@dalbit-yaksok/core'
import { assert } from '@std/assert'
import { assertEquals } from 'assert/equals'
import {
    NotDefinedIdentifierError,
    NotProperIdentifierNameToDefineError,
} from '../../core/error/variable.ts'

Deno.test('Variable name is not a valid identifier', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
1이름 = "홍길동",
1이름 보여주기`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'validation',
        `Expected an validation, but got ${result.reason}`,
    )

    const errorTypes = result.errors!.map((e) => e.constructor)

    assertEquals(errorTypes, [
        NotProperIdentifierNameToDefineError,
        NotDefinedIdentifierError,
    ])
})
