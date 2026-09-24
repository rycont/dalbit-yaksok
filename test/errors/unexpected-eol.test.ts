import { assertIsError } from '@std/assert'
import {
    UnexpectedEndOfCodeError,
    UnexpectedNewlineError,
} from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('예상치 못한 줄바꿈', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `약속, (A)와 (B)를`)
    assertIsError(codeFile.prepareErrors[0], UnexpectedEndOfCodeError)
})

Deno.test('문자열 내 줄바꿈', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `"줄바꿈이
있는 문자열"`,
    )
    assertIsError(codeFile.prepareErrors[0], UnexpectedNewlineError)
})
