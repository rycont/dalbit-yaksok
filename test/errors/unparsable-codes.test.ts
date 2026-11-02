import {
    BrokenBracketError,
    NotExecutableNodeError,
    YaksokSession,
} from '@dalbit-yaksok/core'

import { expect, test } from 'vite-plus/test'

test('Unparsable codes', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `]]`)

    expect(codeFile.prepareErrors[0]).toBeInstanceOf(NotExecutableNodeError)
    expect(codeFile.prepareErrors[1]).toBeInstanceOf(NotExecutableNodeError)
})

test('Unparsable numbers', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `1.2.3`)

    expect(codeFile.prepareErrors[0]).toBeInstanceOf(NotExecutableNodeError)
})

test('Unparsable list', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `자리표 = [1, 2, [3, 4]`)
    expect(codeFile.prepareErrors[0]).toBeInstanceOf(BrokenBracketError)
})
