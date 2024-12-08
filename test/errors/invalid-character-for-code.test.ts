import { assertIsError, unreachable } from 'assert'
import { yaksok } from '../../src/mod.ts'
import { UnexpectedCharError } from '../../src/error/index.ts'

Deno.test('사용할 수 없는 문자', async () => {
    try {
        await yaksok(`내 이름: "정한";`)
        unreachable()
    } catch (error) {
        assertIsError(error, UnexpectedCharError)
    }
})
