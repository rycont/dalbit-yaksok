import { assertIsError } from '@std/assert'

import { NotExecutableNodeError } from '../../core/error/unknown-node.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('올바르지 않은 괄호 묶음', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `(이고)`)

    for (const childError of codeFile.prepareErrors) {
        assertIsError(childError, NotExecutableNodeError)
    }
})
