import { YaksokSession, NotExecutableNodeError } from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('올바르지 않은 괄호 묶음', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `(이고)`)

    for (const childError of codeFile.prepareErrors) {
        expect.assert.instanceOf(childError, NotExecutableNodeError)
    }
})
