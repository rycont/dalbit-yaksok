import { assert, assertIsError } from '@std/assert'
import {
    UnexpectedEndOfCodeError,
    UnexpectedTokenError,
} from '../../core/error/index.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('클래스 정의: 부모 괄호 안 이름이 없으면 오류', async () => {
    const result = await yaksok(`클래스, A()
    값 = 1
`)

    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], UnexpectedTokenError)
})

Deno.test('클래스 정의: 부모 표기 닫는 괄호가 없으면 오류', async () => {
    const result = await yaksok(`클래스, A(B
    값 = 1
`)

    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], UnexpectedEndOfCodeError)
})

Deno.test('클래스 정의: 부모 지정 뒤 토큰이 더 오면 오류', async () => {
    const result = await yaksok(`클래스, A, B, C
    값 = 1
`)

    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], UnexpectedTokenError)
})

Deno.test('클래스 정의: 부모 구분자 없이 식별자가 오면 오류', async () => {
    const result = await yaksok(`클래스, A B
    값 = 1
`)

    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], UnexpectedTokenError)
})
