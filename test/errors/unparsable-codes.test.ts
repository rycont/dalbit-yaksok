import { assert, assertIsError } from '@std/assert'
import { UnexpectedEndOfCodeError } from '../../core/error/prepare.ts'
import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('Unparsable codes', async () => {
    const result = await yaksok(`]]`)
    assert(result.reason === 'validation')

    assertIsError(result.errors.get('main')![0], NotExecutableNodeError)
    assertIsError(result.errors.get('main')![1], NotExecutableNodeError)
})

Deno.test('Unparsable numbers', async () => {
    const result = await yaksok(`1.2.3`)

    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], NotExecutableNodeError)
})

Deno.test('Unparsable list', async () => {
    const result = await yaksok(`자리표 = [1, 2, [3, 4]`)
    assert(result.reason === 'error')
    assertIsError(result.error, UnexpectedEndOfCodeError)
})
