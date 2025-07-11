import { assertIsError, unreachable } from 'assert'
import { yaksok } from '../../core/mod.ts'
import { InvalidTypeForOperatorError, AlreadyDefinedFunctionError } from '../../core/error/index.ts'

Deno.test('약속 안에서 발생한 오류', async () => {
    try {
        await yaksok(`약속, 신나게 놀기
    "이름" / 10 보여주기
    
신나게 놀기`)
        unreachable()
    } catch (error) {
        assertIsError(error, InvalidTypeForOperatorError)
    }
})

Deno.test('동일한 이름으로 약속 재정의 오류', async () => {
    try {
        await yaksok(`
약속, 테스트하기
    "첫 번째 약속" 보여주기

약속, 테스트하기
    "두 번째 약속" 보여주기
`)
        unreachable()
    } catch (error) {
        assertIsError(error, AlreadyDefinedFunctionError)
    }
})

Deno.test('다른 범위에서 동일한 이름으로 약속 정의 (오류 없음)', async () => {
    // This test implicitly checks that no error is thrown.
    // If an error occurs, the test will fail.
    await yaksok(`
약속, 바깥함수
    약속, 안쪽함수
        "안쪽함수 실행됨" 보여주기
    안쪽함수

약속, 다른함수
    약속, 안쪽함수
        "다른 안쪽함수 실행됨" 보여주기
    안쪽함수

바깥함수
다른함수
`)
})
