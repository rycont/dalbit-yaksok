import { YaksokError, YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from 'assert/equals'

Deno.test('Merge identifier name errors', async () => {
    const errors: YaksokError[] = []

    const session = new YaksokSession({
        stderr: (_, error) => {
            errors.push(error)
        },
    })

    session.addModule('main', `정의 되지 않은 약속`)

    assertEquals(errors.length, 1)
    assertEquals(
        errors[0].message,
        '"정의 되지 않은 약속"라는 변수나 약속을 찾을 수 없어요.',
    )
})
