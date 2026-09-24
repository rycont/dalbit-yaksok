import { assert, assertIsError } from '@std/assert'
import { NotProperIdentifierNameToDefineError } from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Valid identifier names', async () => {
    const session1 = new YaksokSession()
    session1.addModule('main', `멍멍이 = 10`)
    const result1 = (await session1.runModules(['main'])).main
    assert(
        result1.reason === 'finish',
        `Expected finish, but got ${result1.reason}`,
    )
    const session2 = new YaksokSession()
    session2.addModule('main', `야용이 = 20`)
    const result2 = (await session2.runModules(['main'])).main
    assert(
        result2.reason === 'finish',
        `Expected finish, but got ${result2.reason}`,
    )
    const session3 = new YaksokSession()
    session3.addModule('main', `ㄱ자_전선 = 20`)
    const result3 = (await session3.runModules(['main'])).main
    assert(
        result3.reason === 'finish',
        `Expected finish, but got ${result3.reason}`,
    )
    const session4 = new YaksokSession()
    session4.addModule('main', `내이름은ㄴ이야 = 20`)
    const result4 = (await session4.runModules(['main'])).main
    assert(
        result4.reason === 'finish',
        `Expected finish, but got ${result4.reason}`,
    )
    const session5 = new YaksokSession()
    session5.addModule('main', `_사용하지않음 = 20`)
    const result5 = (await session5.runModules(['main'])).main
    assert(
        result5.reason === 'finish',
        `Expected finish, but got ${result5.reason}`,
    )
})

Deno.test('Invalid identifier name', async () => {
    const session = new YaksokSession()
    session.addModule('main', `멍멍*이 = 10`)
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'validation',
        `Expected validation, but got ${result.reason}`,
    )
    assertIsError(result.errors![0], NotProperIdentifierNameToDefineError)
})

Deno.test('Cannot use reserved words as an identifier', async () => {
    const session = new YaksokSession()
    session.addModule('main', `만약 = 10`)
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'validation',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors![0], NotProperIdentifierNameToDefineError)
})

Deno.test('Cannot use reserved words as a part of a yaksok name', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
약속, (내용) 보여주기
    "이거 진짜에요?" 반환하기
        `,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'validation',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors![0], NotProperIdentifierNameToDefineError)
})

Deno.test('Cannot use reserved words as a part of a connect name', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
번역(JavaScript), (내용) 보여주기
***
    return "이거 진짜에요?"
***
        `,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'validation',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors![0], NotProperIdentifierNameToDefineError)
})
