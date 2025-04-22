import { unreachable } from 'assert/unreachable'
import { yaksok } from '@dalbit-yaksok/core'
import { assertIsError } from 'assert'
import { NotDefinedIdentifierError } from '../../core/error/variable.ts'
import { assertEquals } from 'assert/equals'
import { ErrorGroups } from '../../core/error/validation.ts'
import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'

Deno.test('Variable name is not a valid identifier', async () => {
    try {
        await yaksok(`
1이름: "홍길동",
1이름 보여주기`)
        unreachable()
    } catch (e) {
        assertIsError(e, ErrorGroups)

        const errorTypes = [...e.errors.values()]
            .flat()
            .map((e) => e.constructor)

        assertEquals(errorTypes, [
            NotDefinedIdentifierError,
            NotExecutableNodeError,
            NotExecutableNodeError,
            NotDefinedIdentifierError,
            NotDefinedIdentifierError,
        ])
    }
})
