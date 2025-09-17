import { YaksokSession } from '@dalbit-yaksok/core'
import { assertEquals } from 'assert/equals'

Deno.test('Step-by-step Execution', async () => {
    let output = ''
    const executedLines: string[] = []

    const session = new YaksokSession({
        stdout(message) {
            output += message
        },
        events: {
            runningCode(_range, _end, _scope, tokens) {
                // `stepByStep`이 true일 때마다 `onRunChild`에서 일시 중지되므로,
                // 이 이벤트는 `session.resume()`이 호출된 후에 발생합니다.
                executedLines.push(tokens[0].value)
            },
        },
    })

    session.stepByStep = true

    session.addModule(
        'main',
        `
"A" 보여주기
"B" 보여주기
"C" 보여주기
        `,
    )

    // 모듈 실행 시작 (첫 줄에서 일시 중지될 것으로 예상)
    const runPromise = session.runModule('main')

    // 첫 번째 줄이 실행되고 일시 중지될 때까지 기다림
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(executedLines, []) // 아직 실행된 줄이 없어야 함 (일시 중지 상태)

    // 재개 -> "A" 실행 후 일시 중지
    session.resume()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(output, 'A')
    assertEquals(executedLines, ['"A"'])

    // 재개 -> "B" 실행 후 일시 중지
    session.resume()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(output, 'AB')
    assertEquals(executedLines, ['"A"', '"B"'])

    // 재개 -> "C" 실행 후 일시 중지
    session.resume()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assertEquals(output, 'ABC')
    assertEquals(executedLines, ['"A"', '"B"', '"C"'])

    // 모든 실행이 완료될 때까지 기다림
    await runPromise

    assertEquals(output, 'ABC')
    assertEquals(executedLines, ['"A"', '"B"', '"C"'])
})
