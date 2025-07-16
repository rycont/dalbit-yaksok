import { assert, assertIsError } from 'assert'
import {
    UnexpectedEndOfCodeError,
    UnexpectedNewlineError,
} from '../../core/error/index.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('예상치 못한 줄바꿈', async () => {
    const result = await yaksok(`약속, (A)와 (B)를`)
    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], UnexpectedEndOfCodeError)
})

Deno.test('문자열 내 줄바꿈', async () => {
    const result = await yaksok(`"줄바꿈이
있는 문자열"`)
    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], UnexpectedNewlineError)
})
