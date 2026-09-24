import { assertIsError } from '@std/assert'
import { YaksokSession } from '../../core/mod.ts'
import { CannotReturnOutsideFunctionError } from '../../core/error/index.ts'

Deno.test('약속의 밖에서는 `약속 그만`을 쓸 수 없음', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, _machineReadable, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `"약속 밖에서는 약속을 멈출 수 없습니다" 보여주기
약속 그만`,
    )
    await codeFile.run()
    assertIsError(errors[0], CannotReturnOutsideFunctionError)
})
