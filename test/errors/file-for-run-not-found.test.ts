import { assert, expect, test } from 'vite-plus/test'
import { FileForRunNotExistError } from '../../core/error/prepare.ts'
import { YaksokSession } from '../../core/mod.ts'

test('없는 파일 실행 요청', async () => {
    const session = new YaksokSession()
    try {
        session.addModule('main', `@코레일 출발하기`)
        expect.unreachable()
    } catch (error) {
        expect.assert.instanceOf(error, FileForRunNotExistError)
    }

    const session2 = new YaksokSession()
    session2.addModule(
        '코레일',
        `
요금계산표 = "없음"
            `,
    )
    assert(!session2.files['main'])
})
