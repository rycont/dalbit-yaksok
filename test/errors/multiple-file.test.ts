import { assert, assertIsError } from '@std/assert'
import { ErrorInModuleError } from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Cannot find entry point in files', async () => {
    const session = new YaksokSession()
    session.addModule('dummy1', '')
    session.addModule('dummy2', '')
    assert(!session.files['main'])
})

Deno.test('No files to run', async () => {
    const session = new YaksokSession()
    assert(!session.files['main'])
})

// Deno.test('Error in importing module', async () => {
//     const errors: unknown[] = []
//     const session = new YaksokSession({
//         stderr(_message, _machineReadable, error) {
//             errors.push(error)
//         },
//     })

//     session.addModule('아두이노', `이름 = "아두이노" / 2`)
//     const codeFile = session.addModule('main', '(@아두이노 이름) 보여주기')

//     await codeFile.run()
//     assertIsError(errors[0], ErrorInModuleError)
// })

// Deno.test('Error in parsing module file', async () => {
//     const session = new YaksokSession()
//     session.addModule('아두이노', `약속, 이름`)
//     const codeFile = session.addModule('main', '(@아두이노 이름) 보여주기')

//     assertIsError(codeFile.prepareErrors[0], ErrorInModuleError)
// })

Deno.test('Error in using module function', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, _machineReadable, error) {
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
