import { assertIsError } from '@std/assert'
import { UnexpectedEndOfCodeError } from '../../core/error/prepare.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('끝나지 못한 괄호', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `나이 = 10 + (20`)
    assertIsError(codeFile.prepareErrors[0], UnexpectedEndOfCodeError)
})
