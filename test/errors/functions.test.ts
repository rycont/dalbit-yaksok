import { assert, assertIsError } from 'assert'
import { yaksok } from '../../core/mod.ts'
import { InvalidTypeForOperatorError } from '../../core/error/index.ts'

Deno.test('약속 안에서 발생한 오류', async () => {
    const result = await yaksok(`약속, 신나게 놀기
    "이름" / 10 보여주기
    
신나게 놀기`)
    assert(result.reason === 'error', `Expected an error, but got ${result.reason}`)
    assertIsError(result.error, InvalidTypeForOperatorError)
})
