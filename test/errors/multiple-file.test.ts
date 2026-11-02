import { ErrorInModuleError, YaksokSession } from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('Error in using module function', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    await session
        .addModule(
            '아두이노',
            `약속, 이름
    "아두이노" / 2 반환하기
`,
        )
        .run()

    const codeFile = session.addModule('main', '(@아두이노 이름) 보여주기')
    await codeFile.run()

    expect(errors[0]).toBeInstanceOf(ErrorInModuleError)
})
