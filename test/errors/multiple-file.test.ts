import { assert, assertIsError } from '@std/assert'
import {
    ErrorInModuleError,
    FileForRunNotExistError,
} from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Cannot find entry point in files', async () => {
    const session = new YaksokSession()
    session.addModule('dummy1', '')
    session.addModule('dummy2', '')
    const result = (await session.runModule(['main'])).main

    assert(result.reason === 'error')
    assertIsError(result.errors?.[0], FileForRunNotExistError)
})

Deno.test('No files to run', async () => {
    const session = new YaksokSession()
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'error')
    assertIsError(result.errors?.[0], FileForRunNotExistError)
})

Deno.test('Error in importing module', async () => {
    const session = new YaksokSession()

    session.addModule('main', '(@아두이노 이름) 보여주기')
    session.addModule('아두이노', `이름 = "아두이노" / 2`)

    const result = (await session.runModule(['main'])).main

    assert(result.reason === 'error')
    assertIsError(result.errors?.[0], ErrorInModuleError)
})

Deno.test('Error in parsing module file', async () => {
    const session = new YaksokSession()
    session.addModule('main', '(@아두이노 이름) 보여주기')
    session.addModule('아두이노', `약속, 이름`)
    const result = (await session.runModule(['main'])).main

    assert(result.reason === 'validation')
    assertIsError(result.errors![0], ErrorInModuleError)
})

Deno.test('Error in using module function', async () => {
    const session = new YaksokSession()
    session.addModule('main', '(@아두이노 이름) 보여주기')
    session.addModule(
        '아두이노',
        `약속, 이름
    "아두이노" / 2 반환하기
`,
    )
    const result = (await session.runModule(['main'])).main

    assert(result.reason === 'error')
    assertIsError(result.errors?.[0], ErrorInModuleError)
})
