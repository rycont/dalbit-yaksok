import { YaksokSession, BreakNotInLoopError } from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('반복의 밖에서는 `반복 그만`을 쓸 수 없음', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `"반복 밖에서는 반복을 멈출 수 없습니다" 보여주기
반복 그만`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], BreakNotInLoopError)
})
