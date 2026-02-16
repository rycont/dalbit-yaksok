import { assertEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import { StandardExtension } from '../standard/mod.ts'

Deno.test('extend 옵션으로 표준 모듈을 base context에 올릴 수 있다', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    await session.extend(new StandardExtension(), {
        baseContextFileName: ['표준'],
    })

    session.addModule(
        'main',
        `
결과 = [1, 2, 3, 4, 5].(람다 값: 값 > 3)로 filter
결과 보여주기
`.trim(),
    )

    await session.runModule('main')

    assertEquals(output, '[4, 5]\n')
})
