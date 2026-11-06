import { YaksokSession } from '@dalbit-yaksok/core'
import {
    FunctionMustHaveSignature,
    MissingFunctionBody,
} from '@dalbit-yaksok/statement-function'
import { expect, test } from 'vite-plus/test'

test('온전하지 않은 약속 정의', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `약속, (A)와 (`)
    expect.assert.instanceOf(codeFile.prepareErrors[0], MissingFunctionBody)
})

test('약속 정의 문법이 틀림', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `약속, (A)와 (((((
"여보세요?" 보여주기
`,
    )
    expect.assert.instanceOf(codeFile.prepareErrors[0], MissingFunctionBody)
})

test('온전하지 않은 번역: 정의가 없음', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `번역(Runtime),`)
    expect.assert.instanceOf(
        codeFile.prepareErrors[0],
        FunctionMustHaveSignature,
    )
})
