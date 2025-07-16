import { yaksok } from '@dalbit-yaksok/core'
import { assert, assertIsError } from 'assert'
import { assertEquals } from 'assert/equals'
import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { NotDefinedIdentifierError } from '../../core/error/variable.ts'

Deno.test('Variable name is not a valid identifier', async () => {
    const result = await yaksok(`
1이름: "홍길동",
1이름 보여주기`)
    assert(
        result.reason === 'validation',
        `Expected an validation, but got ${result.reason}`,
    )
    assertIsError(result.errors, ErrorGroups)

    const errorTypes = [...result.errors.values()]
        .flat()
        .map((e) => e.constructor)

    assertEquals(errorTypes, [
        NotDefinedIdentifierError,
        NotExecutableNodeError,
        NotExecutableNodeError,
        NotDefinedIdentifierError,
        NotDefinedIdentifierError,
    ])
})
