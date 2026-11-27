import { expect, test } from 'vite-plus/test'
import { FileForRunNotExistError } from '../../core/error/prepare.ts'
import { YaksokSession } from '../../core/mod.ts'

test('없는 파일 실행 요청', async () => {
    const session = new YaksokSession()

    const codeFile = session.addModule('main', `@코레일 출발하기`)
    expect.assert.instanceOf(codeFile.prepareErrors[0], FileForRunNotExistError)
})
