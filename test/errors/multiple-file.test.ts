import { assert, assertIsError } from 'assert'
import {
    ErrorInModuleError,
    FileForRunNotExistError,
} from '../../core/error/index.ts'
import { yaksok } from '../../core/mod.ts'

Deno.test('Cannot find entry point in files', async () => {
    const result = await yaksok({
        dummy1: '',
        dummy2: '',
    })

    assert(result.reason === 'error')
    assertIsError(result.error, FileForRunNotExistError)
})

Deno.test('No files to run', async () => {
    const result = await yaksok({})
    assert(result.reason === 'error')
    assertIsError(result.error, FileForRunNotExistError)
})

Deno.test('Error in importing module', async () => {
    const result = await yaksok({
        main: '(@아두이노 이름) 보여주기',
        아두이노: `
이름 = "아두이노" / 2
`,
    })
    assert(result.reason === 'error')
    assertIsError(result.error, ErrorInModuleError)
})

Deno.test('Error in parsing module file', async () => {
    const result = await yaksok({
        main: '(@아두이노 이름) 보여주기',
        아두이노: `약속, 이름`,
    })

    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], ErrorInModuleError)
})

Deno.test('Error in using module function', async () => {
    const result = await yaksok({
        main: '(@아두이노 이름) 보여주기',
        아두이노: `약속, 이름
    "아두이노" / 2 반환하기
`,
    })

    assert(result.reason === 'error')
    assertIsError(result.error, ErrorInModuleError)
})
