import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from 'assert/equals'

Deno.test('debugger keyword', async () => {
    let output = ''
    let paused = false

    const session = new YaksokSession({
        stdout(message) {
            output += message
        },
        events: {
            pause() {
                paused = true
            },
        },
    })

    session.addModule(
        'main',
        `
"A" 보여주기
"B" 보여주기
잠깐 멈추기
"C" 보여주기
"D" 보여주기
`,
    )

    const runPromise = session.runModule('main')

    // Wait for pause
    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            if (paused) {
                clearInterval(interval)
                resolve()
            }
        }, 100)
    })

    assertEquals(output, 'AB')
    assertEquals(paused, true)

    await session.resume()
    await runPromise

    assertEquals(output, 'ABCD')
})
