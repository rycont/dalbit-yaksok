import { assertIsError } from '@std/assert'
import { yaksok } from '../../core/mod.ts'
import { UnexpectedCharError } from '../../core/error/prepare.ts'
import { ErrorGroups } from '../../core/error/validation.ts'
import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'

Deno.test('Unparsable codes', async () => {
    try {
        await yaksok(`]]`)
    } catch (e) {
        assertIsError(e, ErrorGroups)
        assertIsError(e.errors.get('main')![0], NotExecutableNodeError)
        assertIsError(e.errors.get('main')![1], NotExecutableNodeError)
    }
})

Deno.test('Unparsable numbers', async () => {
    try {
        await yaksok(`1.2.3`)
    } catch (e) {
        assertIsError(e, UnexpectedCharError)
    }
})
