import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from 'assert/equals'

Deno.test(
    'Step-by-step Execution - No runningCode event before resume',
    async () => {
        let output = ''
        const executedLines: string[] = []

        const session = new YaksokSession({
            stdout(message) {
                output += message
            },
            events: {
                runningCode(_range, _end, _scope, tokens) {
                    executedLines.push(tokens[0].value)
                },
            },
        })

        session.stepByStep = true

        session.addModule(
            'main',
            `
"X" 보여주기
"Y" 보여주기
        `,
        )

        const runPromise = session.runModule('main')

        // 첫 줄에서 일시 중지되었지만, 아직 resume()이 호출되지 않았으므로 runningCode 이벤트는 발생하지 않아야 함
        await new Promise((resolve) => setTimeout(resolve, 100))
        assertEquals(executedLines, [])
        assertEquals(output, '')

        session.resume()
        await new Promise((resolve) => setTimeout(resolve, 100))
        assertEquals(executedLines, ['"X"'])
        assertEquals(output, 'X')

        session.resume()
        await new Promise((resolve) => setTimeout(resolve, 100))
        assertEquals(executedLines, ['"X"', '"Y"'])
        assertEquals(output, 'XY')

        await runPromise
    },
)

Deno.test('Step-by-step Execution - Multiple resume calls', async () => {
    let output = ''
    const executedLines: string[] = []

    const session = new YaksokSession({
        stdout(message) {
            output += message
        },
        events: {
            runningCode(_range, _end, _scope, tokens) {
                executedLines.push(tokens[0].value)
            },
        },
    })

    session.stepByStep = true

    session.addModule(
        'main',
        `
1 보여주기
2 보여주기
3 보여주기
4 보여주기
        `,
    )

    const runPromise = session.runModule('main')

    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(executedLines, [])
    assertEquals(output, '')

    // 첫 번째 resume
    session.resume()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(executedLines, ['1'])
    assertEquals(output, '1')

    // 두 번째 resume
    session.resume()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(executedLines, ['1', '2'])
    assertEquals(output, '12')

    // 세 번째 resume
    session.resume()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(executedLines, ['1', '2', '3'])
    assertEquals(output, '123')

    // 네 번째 resume
    session.resume()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(executedLines, ['1', '2', '3', '4'])
    assertEquals(output, '1234')

    await runPromise
    assertEquals(output, '1234')
    assertEquals(executedLines, ['1', '2', '3', '4'])
})
