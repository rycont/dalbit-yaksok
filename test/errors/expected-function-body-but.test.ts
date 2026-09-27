import { assertIsError } from '@std/assert'
import { MissingFunctionBody, YaksokSession } from '@dalbit-yaksok/core'

Deno.test('온전하지 않은 약속: 줄바꿈 후에 들여쓰기 없음', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `약속, (A)와 (B)를 더하기
축하하기`,
    )
    assertIsError(codeFile.prepareErrors[0], MissingFunctionBody)
})

Deno.test('온전하지 않은 약속: 줄 바꾸고 코드가 끝남', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `약속, (A)와 (B)를 더하기
`,
    )
    assertIsError(codeFile.prepareErrors[0], MissingFunctionBody)
})

Deno.test('온전하지 않은 번역: 줄바꿈 후에 들여쓰기 없음', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `번역(Runtime), (A)를 출력하기
축하하기`,
    )
    assertIsError(codeFile.prepareErrors[0], MissingFunctionBody)
})

Deno.test('온전하지 않은 번역: 줄 바꾸고 코드가 끝남', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `번역(Runtime), (A)랄까 고민하기
`,
    )
    assertIsError(codeFile.prepareErrors[0], MissingFunctionBody)
})
