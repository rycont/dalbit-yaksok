import { YaksokSession } from '../core/mod.ts'
import { StringValue } from '../core/value/primitive.ts'
import { assertEquals } from 'assert/equals'

Deno.test('입력받기 without question', async () => {
    const answers = ['Alice']
    const session = new YaksokSession({
        stdin: async (question) => {
            assertEquals(question, undefined)
            return answers.shift() ?? ''
        },
    })

    session.addModule(
        'main',
        `
이름 = 입력받기
`,
    )

    await session.runModule('main')

    const scope = session.entrypoint?.ranScope
    const result = scope?.getVariable('이름') as StringValue

    assertEquals(result.value, 'Alice')
})

Deno.test('질문과 함께 입력받기', async () => {
    let receivedQuestion: string | undefined
    const session = new YaksokSession({
        stdin: async (question) => {
            receivedQuestion = question
            return '30'
        },
    })

    session.addModule(
        'main',
        `
나이 = '나이가 어떻게 되세요?' 입력받기
`,
    )

    await session.runModule('main')

    const scope = session.entrypoint?.ranScope
    const result = scope?.getVariable('나이') as StringValue

    assertEquals(receivedQuestion, '나이가 어떻게 되세요?')
    assertEquals(result.value, '30')
})
