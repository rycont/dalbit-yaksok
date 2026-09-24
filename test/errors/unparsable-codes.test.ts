import { assertIsError } from '@std/assert'
import { UnexpectedEndOfCodeError } from '../../core/error/prepare.ts'
import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Unparsable codes', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `]]`)

    assertIsError(codeFile.prepareErrors[0], NotExecutableNodeError)
    assertIsError(codeFile.prepareErrors[1], NotExecutableNodeError)
})

Deno.test('Unparsable numbers', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `1.2.3`)

    assertIsError(codeFile.prepareErrors[0], NotExecutableNodeError)
})

Deno.test('Unparsable list', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `자리표 = [1, 2, [3, 4]`)
    assertIsError(codeFile.prepareErrors[0], UnexpectedEndOfCodeError)
})

Deno.test('Unparsable function call', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `비만도 = 키가 (`)
    assertIsError(codeFile.prepareErrors[0], UnexpectedEndOfCodeError)
})
