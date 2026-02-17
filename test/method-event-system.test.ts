import { dalbitToJS, YaksokSession } from '../core/mod.ts'
import { assertEquals } from '@std/assert'

Deno.test('메소드 이벤트 구독 및 실행', async () => {
    let output = ''
    const session = new YaksokSession({
        stdout(value) {
            output += value + '\n'
        },
    })

    session.addModule(
        'main',
        `
메소드(숫자), 이벤트(CHANGED), 바뀌었을 때

숫자형_변수 = 10
숫자형_변수.바뀌었을 때
    "숫자가 바뀌었어요!" 보여주기
    자신 보여주기
`,
    )

    // Run the module. It should register the event listener.

    session.eventCreation.sub('CHANGED', (args, callback, terminate) => {
        if (dalbitToJS(args['자신']) === 10) {
            callback()
            terminate()
        }
    })

    await session.runModule('main')

    assertEquals(output, '숫자가 바뀌었어요!\n10\n')
})
