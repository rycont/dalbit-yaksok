import { assert, assertIsError } from 'assert'
import { yaksok } from '../../core/mod.ts'
import { UnexpectedTokenError } from '../../core/error/index.ts'

Deno.test('인자를 닫는 괄호가 제 위치에 없습니다', async () => {
    const result = await yaksok(`
약속, (음식 10)을 맛있게 만들기
    음식 + "을/를 맛있게 만들었습니다." 보여주기
`)
    assert(result.reason === 'error', `Expected an error, but got ${result.reason}`)
    assertIsError(result.error, UnexpectedTokenError)
})
