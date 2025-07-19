import { YaksokSession } from '@dalbit-yaksok/core'
import { assertGreaterOrEqual } from 'assert'
import { assertEquals } from 'assert/equals'
import { assertLess } from 'assert/less'

Deno.test('Pause and Resume Execution', async () => {
    let output = ''

    const startTime = new Date().getTime()

    let pausedTime = -1
    let resumeTime = -1

    const session = new YaksokSession({
        stdout(message) {
            output += message
            console.log(`[STDOUT] ${message}`)
        },
        events: {
            pause() {
                console.log('[PAUSED]')
                pausedTime = new Date().getTime() - startTime
            },
            resume() {
                console.log('[RESUMED]')
                resumeTime = new Date().getTime() - startTime
            },
        },
    })

    session.addModule(
        'main',
        `
"A" 보여주기
"B" 보여주기
"C" 보여주기
"D" 보여주기
"E" 보여주기
"F" 보여주기
`,
        {
            executionDelay: 1000,
        },
    )

    session.runModule('main')
    await new Promise((resolve) => setTimeout(resolve, 2500))
    session.pause()

    assertEquals(output, 'AB')

    await new Promise((resolve) => setTimeout(resolve, 2000))
    session.resume()
    await session.runningPromise

    assertEquals(output, 'ABCDEF')

    assertGreaterOrEqual(pausedTime, 2500)
    assertLess(pausedTime, 3000)

    assertGreaterOrEqual(resumeTime, 4500)
    assertLess(resumeTime, 5000)
})
