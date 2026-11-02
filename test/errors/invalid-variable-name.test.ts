import {
    NotDefinedIdentifierError,
    NotProperIdentifierNameToDefineError,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('Variable name is not a valid identifier', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule(
        'main',
        `1이름 = "홍길동"
1이름 보여주기`,
    )

    const errorTypes = codeFile.prepareErrors.map((e) => e.constructor)

    expect(errorTypes).toStrictEqual([
        NotProperIdentifierNameToDefineError,
        NotDefinedIdentifierError,
    ])
})
