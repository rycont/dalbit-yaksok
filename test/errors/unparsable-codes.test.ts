import { assert, assertIsError } from '@std/assert'
import { UnexpectedEndOfCodeError } from '../../core/error/prepare.ts'
import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Unparsable codes', async () => {
    const session = new YaksokSession()
    session.addModule('main', `]]`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'validation')

    assertIsError(result.errors![0], NotExecutableNodeError)
    assertIsError(result.errors![1], NotExecutableNodeError)
})

Deno.test('Unparsable numbers', async () => {
    const session = new YaksokSession()
    session.addModule('main', `1.2.3`)
    const result = (await session.runModules(['main'])).main

    assert(result.reason === 'validation')
    assertIsError(result.errors![0], NotExecutableNodeError)
})

Deno.test('Unparsable list', async () => {
    const session = new YaksokSession()
    session.addModule('main', `자리표 = [1, 2, [3, 4]`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedEndOfCodeError)
})

Deno.test('Unparsable function call', async () => {
    const session = new YaksokSession()
    session.addModule('main', `비만도 = 키가 (`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedEndOfCodeError)
})
