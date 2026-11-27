import {
    AlreadyDefinedFunctionError,
    InvalidTypeForOperatorError,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('약속 안에서 발생한 오류', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `약속, 신나게 놀기
    "이름" / 10 보여주기

신나게 놀기`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], InvalidTypeForOperatorError)
})

test('동일한 이름으로 약속 재정의 오류', async () => {
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

    const codeFile = session.addModule(
        'main',
        `
약속, 테스트하기
    "첫 번째 약속" 보여주기

약속, 테스트하기
    "두 번째 약속" 보여주기
`,
    )

    expect.assert.instanceOf(
        codeFile.prepareErrors[0],
        AlreadyDefinedFunctionError,
    )
})
