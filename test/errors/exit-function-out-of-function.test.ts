import {
    YaksokSession,
    CannotReturnOutsideFunctionError,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('약속의 밖에서는 `약속 그만`을 쓸 수 없음', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `"약속 밖에서는 약속을 멈출 수 없습니다" 보여주기
약속 그만`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], CannotReturnOutsideFunctionError)
})
