import { BrokenBracketError, YaksokSession } from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('끝나지 못한 괄호', async () => {
    const session = new YaksokSession()
    const codeFile = session.addModule('main', `나이 = 10 + (20`)

    expect(codeFile.prepareErrors[0]).toBeInstanceOf(BrokenBracketError)
})
