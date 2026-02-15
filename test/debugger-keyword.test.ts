import { YaksokSession, Scope, Pause } from '../core/mod.ts'
import { assertEquals } from 'assert/equals'
import { assert } from 'assert/assert'

Deno.test('debugger keyword', async () => {
    let output = ''
    let paused = false
    let debugEventPayload: { scope: Scope; node: Pause } | undefined

    const session = new YaksokSession({
        stdout(message) {
            output += message
        },
        events: {
            pause() {
                paused = true

                assertEquals(output, 'AB')
                assertEquals(paused, true)

                session.resume()
            },
            debug(scope, node) {
                debugEventPayload = { scope, node }
                assertEquals(scope.getVariable('내_변수').toPrint(), '10')
            },
        },
    })

    session.addModule(
        'main',
        `
"A" 보여주기
"B" 보여주기
내_변수 = 10
잠깐 멈추기
내_변수 = 20
"C" 보여주기
"D" 보여주기
`,
    )

    const results = await session.runModule('main')
    const result = results.get('main')!
    assert(result.reason === 'finish')
    assert(debugEventPayload !== null)
    assertEquals(debugEventPayload?.node.tokens[0].position.line, 5)
    assertEquals(
        result.codeFile.ranScope?.getVariable('내_변수').toPrint(),
        '20',
    )
    assertEquals(output, 'ABCD')
})
