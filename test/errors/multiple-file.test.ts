import { assertIsError } from '@std/assert'
import { ErrorInModuleError } from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Error in using module function', async () => {
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

    assertIsError(errors[0], ErrorInModuleError)
})
