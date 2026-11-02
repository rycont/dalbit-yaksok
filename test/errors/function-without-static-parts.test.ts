import {
    YaksokSession,
    FunctionMustHaveOneOrMoreStringPartError,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('고정된 부분이 없는 함수', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `
약속, (A) (B) (C)
    A + B + C 반환하기

(10) (20) (30) 보여주기
            `,
    )

    expect(codeFile.prepareErrors[0]).toBeInstanceOf(
        FunctionMustHaveOneOrMoreStringPartError,
    )
})
