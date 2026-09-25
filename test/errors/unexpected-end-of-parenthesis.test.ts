import { assertIsError } from '@std/assert'
import { BrokenBracketError, YaksokSession } from '@dalbit-yaksok/core'

Deno.test('끝나지 못한 괄호', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `나이 = 10 + (20`)

    assertIsError(codeFile.prepareErrors[0], BrokenBracketError)
})
