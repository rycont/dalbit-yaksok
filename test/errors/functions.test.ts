import { assert, assertEquals, assertIsError } from '@std/assert'
import {
    AlreadyDefinedFunctionError,
    InvalidTypeForOperatorError,
} from '../../core/error/index.ts'
import { yaksok, YaksokSession } from '../../core/mod.ts'

Deno.test('약속 안에서 발생한 오류', async () => {
    const result = await yaksok(`약속, 신나게 놀기
    "이름" / 10 보여주기
    
신나게 놀기`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, InvalidTypeForOperatorError)
})

Deno.test('동일한 이름으로 약속 재정의 오류', async () => {
    let stderrOutput = ''
    //         await yaksok(
    //             `
    // 약속, 테스트하기
    //     "첫 번째 약속" 보여주기

    // 약속, 테스트하기
    //     "두 번째 약속" 보여주기
    // `,
    //             {
    //                 stderr(message: string) {
    //                     stderrOutput += message + '\n'
    //                 },
    //             },
    //         )

    const session = new YaksokSession({
        stderr(message) {
            stderrOutput += message + '\n'
        },
    })

    session.addModule(
        'main',
        `
약속, 테스트하기
    "첫 번째 약속" 보여주기

약속, 테스트하기
    "두 번째 약속" 보여주기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!
    assert(result.reason === 'validation')
    assertIsError(result.errors.get('main')![0], AlreadyDefinedFunctionError)

    assertEquals(
        stderrOutput,
        `─────

🚨  \x1b[1m문제가 발생했어요\x1b[0m\x1b[2m (main 파일)\x1b[0m 🚨
> 이미 \x1b[1m\x1b[34m"테스트하기"\x1b[0m\x1b[0m라는 약속(번역)이 있어요

┌─────
│  \x1b[2m3      "첫 번째 약속" 보여주기\x1b[0m
│  \x1b[2m4  \x1b[0m
│  5  \x1b[1m\x1b[4m약속, 테스트하기\x1b[24m\x1b[0m
│  \x1b[2m6      "두 번째 약속" 보여주기\x1b[0m
│  \x1b[2m7  \x1b[0m
└─────

`,
    )
})

Deno.test('다른 범위에서 동일한 이름으로 약속 정의 (오류 없음)', async () => {
    // This test implicitly checks that no error is thrown.
    // If an error occurs, the test will fail.
    let output = ''

    const session = new YaksokSession({
        stdout(message: string) {
            output += message + '\n'
        },
    })

    session.addModule(
        'main',
        `
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
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!

    assert(
        result.reason === 'finish',
        `Expected finish, but got ${result.reason}`,
    )
    assertEquals(output, '안쪽함수 실행됨\n다른 안쪽함수 실행됨\n')
})
