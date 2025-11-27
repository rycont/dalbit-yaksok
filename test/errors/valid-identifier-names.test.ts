import { assert, assertIsError } from 'assert'
import { NotProperIdentifierNameToDefineError } from '../../core/error/index.ts'
import { NotDefinedIdentifierError, yaksok } from '../../core/mod.ts'

Deno.test('Valid identifier names', async () => {
    const result1 = await yaksok(`멍멍이 = 10`)
    assert(
        result1.reason === 'finish',
        `Expected finish, but got ${result1.reason}`,
    )
    const result2 = await yaksok(`야용이 = 20`)
    assert(
        result2.reason === 'finish',
        `Expected finish, but got ${result2.reason}`,
    )
    const result3 = await yaksok(`ㄱ자_전선 = 20`)
    assert(
        result3.reason === 'finish',
        `Expected finish, but got ${result3.reason}`,
    )
    const result4 = await yaksok(`내이름은ㄴ이야 = 20`)
    assert(
        result4.reason === 'finish',
        `Expected finish, but got ${result4.reason}`,
    )
    const result5 = await yaksok(`_사용하지않음 = 20`)
    assert(
        result5.reason === 'finish',
        `Expected finish, but got ${result5.reason}`,
    )
})

Deno.test('Invalid identifier name', async () => {
    const result = await yaksok(`멍멍*이 = 10`)
    assert(
        result.reason === 'validation',
        `Expected validation, but got ${result.reason}`,
    )
    assertIsError(result.errors.get('main')![0], NotDefinedIdentifierError)
})

Deno.test('Cannot use reserved words as an identifier', async () => {
    const result = await yaksok(`만약 = 10`)
    assert(
        result.reason === 'validation',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(
        result.errors.get('main')![0],
        NotProperIdentifierNameToDefineError,
    )
})

Deno.test('Cannot use reserved words as a part of a yaksok name', async () => {
    const result = await yaksok(`
약속, (내용) 보여주기
    "이거 진짜에요?" 반환하기
        `)
    assert(
        result.reason === 'validation',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(
        result.errors.get('main')![0],
        NotProperIdentifierNameToDefineError,
    )
})

Deno.test('Cannot use reserved words as a part of a connect name', async () => {
    const result = await yaksok(`
번역(JavaScript), (내용) 보여주기
***
    return "이거 진짜에요?"
***
        `)
    assert(
        result.reason === 'validation',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(
        result.errors.get('main')![0],
        NotProperIdentifierNameToDefineError,
    )
})
