import { assertEquals, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { yaksok } from '../core/mod.ts'
import { NotDefinedIdentifierError } from '../core/error/index.ts'

Deno.test('식별자 오타 교정 제안 테스트', async () => {
    const code = `
이름: "정한"
이람 보여주기
`
    try {
        await yaksok(code)
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            assertEquals(error.resource?.name, '이람')
            assertEquals(error.resource?.suggestedFix, '이름')
        } else {
            throw error
        }
    }
})

Deno.test('약속(함수) 오타 교정 제안 테스트', async () => {
    const code = `
약속, 인사하기
    "안녕" 보여주기

안사하기
`
    try {
        await yaksok(code)
    } catch (error) {
        if (error instanceof NotDefinedIdentifierError) {
            assertEquals(error.resource?.name, '안사하기')
            assertEquals(error.resource?.suggestedFix, '인사하기')
        } else {
            throw error
        }
    }
})
