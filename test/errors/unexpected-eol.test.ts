import { assertIsError } from 'assert'
import { yaksok } from '../../core/mod.ts'
import {
    UnexpectedEndOfCodeError,
    UnexpectedNewlineError,
} from '../../core/error/index.ts'

Deno.test('예상치 못한 줄바꿈', async () => {
    try {
        await yaksok(`약속, (A)와 (B)를`)
    } catch (error) {
        assertIsError(error, UnexpectedEndOfCodeError)
        console.log(error)
    }
})

Deno.test('문자열 내 줄바꿈', async () => {
    try {
        await yaksok(`
    "줄바꿈이
    있는 문자열"
        `)
    } catch (error) {
        assertIsError(error, UnexpectedNewlineError)
        console.log(error)
    }
})
