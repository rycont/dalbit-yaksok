import {
    YaksokSession,
    IndentIsNotMultipleOf4Error,
    IndentLevelMismatchError,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('길이가 잘못된 인덴트', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
이름 = '홍길동'
     나이 = 20
`,
    )
    expect.assert.instanceOf(
        codeFile.prepareErrors[0],
        IndentIsNotMultipleOf4Error,
    )
})

test('시작부터 들어간 인덴트', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
    이름 = '홍길동'
     나이 = 20
`,
    )
    expect.assert.instanceOf(
        codeFile.prepareErrors[0],
        IndentLevelMismatchError,
    )
})

test('레벨을 초월한 인덴트', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
이름 = '홍길동'
        나이 = 20
`,
    )
    expect.assert.instanceOf(
        codeFile.prepareErrors[0],
        IndentLevelMismatchError,
    )
})
