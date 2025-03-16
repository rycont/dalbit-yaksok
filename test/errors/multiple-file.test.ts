import { assertIsError } from 'assert'
import { yaksok } from '../../core/mod.ts'
import {
    ErrorInModuleError,
    FileForRunNotExistError,
} from '../../core/error/index.ts'

Deno.test('Cannot find entry point in files', async () => {
    try {
        await yaksok({
            dummy1: '',
            dummy2: '',
        })
    } catch (error) {
        assertIsError(error, FileForRunNotExistError)
    }
})

Deno.test('No files to run', async () => {
    try {
        await yaksok({})
    } catch (error) {
        assertIsError(error, FileForRunNotExistError)
    }
})

Deno.test('Error in importing module', async () => {
    try {
        await yaksok({
            아두이노: `
이름 = "아두이노" / 2
`,
            main: '(@아두이노 이름) 보여주기',
        })
    } catch (error) {
        assertIsError(error, ErrorInModuleError)
    }
})

Deno.test('Error in parsing module file', async () => {
    try {
        await yaksok({
            아두이노: `
약속, 이름`,
            main: '(@아두이노 이름) 보여주기',
        })
    } catch (error) {
        assertIsError(error, ErrorInModuleError)
    }
})

Deno.test('Error in using module function', async () => {
    try {
        await yaksok({
            아두이노: `
약속, 이름
    "아두이노" / 2 반환하기
`,
            main: '(@아두이노 이름) 보여주기',
        })
    } catch (error) {
        assertIsError(error, ErrorInModuleError)
    }
})
