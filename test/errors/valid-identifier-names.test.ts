import { assertIsError } from '@std/assert'
import { NotProperIdentifierNameToDefineError } from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Valid identifier names', async () => {
    const session1 = new YaksokSession()
    const codeFile1 = session1.addModule('main', `멍멍이 = 10`)
    await codeFile1.run()
    const session2 = new YaksokSession()
    const codeFile2 = session2.addModule('main', `야용이 = 20`)
    await codeFile2.run()
    const session3 = new YaksokSession()
    const codeFile3 = session3.addModule('main', `ㄱ자_전선 = 20`)
    await codeFile3.run()
    const session4 = new YaksokSession()
    const codeFile4 = session4.addModule('main', `내이름은ㄴ이야 = 20`)
    await codeFile4.run()
    const session5 = new YaksokSession()
    const codeFile5 = session5.addModule('main', `_사용하지않음 = 20`)
    await codeFile5.run()
})

Deno.test('Invalid identifier name', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `멍멍*이 = 10`)

    assertIsError(
        codeFile.prepareErrors[0],
        NotProperIdentifierNameToDefineError,
    )
})

Deno.test('Cannot use reserved words as an identifier', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `만약 = 10`)
    assertIsError(
        codeFile.prepareErrors[0],
        NotProperIdentifierNameToDefineError,
    )
})

Deno.test('Cannot use reserved words as a part of a yaksok name', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
약속, (내용) 보여주기
    "이거 진짜에요?" 반환하기
        `,
    )
    assertIsError(
        codeFile.prepareErrors[0],
        NotProperIdentifierNameToDefineError,
    )
})

Deno.test('Cannot use reserved words as a part of a connect name', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
번역(JavaScript), (내용) 보여주기
***
    return "이거 진짜에요?"
***
        `,
    )
    assertIsError(
        codeFile.prepareErrors[0],
        NotProperIdentifierNameToDefineError,
    )
})
