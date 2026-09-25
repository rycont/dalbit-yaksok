import { assert } from '@std/assert'

import { UnexpectedCharError, YaksokSession } from '@dalbit-yaksok/core'

Deno.test('문자열 내 줄바꿈', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `"줄바꿈이
있는 문자열"`,
    )

    const [error] = codeFile.prepareErrors

    assert(error instanceof UnexpectedCharError)
    assert(error.resource.parts === '문자열')
    assert(error.resource.char === '줄바꿈')
})
