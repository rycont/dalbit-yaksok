import { assert, assertIsError } from 'assert'
import { yaksok } from '../../core/mod.ts'
import { FunctionMustHaveOneOrMoreStringPartError } from '../../core/error/index.ts'

Deno.test('고정된 부분이 없는 함수', async () => {
    const result = await yaksok(`
약속, (A) (B) (C)
    A + B + C 반환하기

(10) (20) (30) 보여주기
            `)
    assert(result.reason === 'error', `Expected an error, but got ${result.reason}`)
    assertIsError(result.error, FunctionMustHaveOneOrMoreStringPartError)
})
