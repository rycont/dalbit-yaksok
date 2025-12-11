// import { YaksokSession } from '../core/mod.ts'
// import { StringValue } from '../core/value/primitive.ts'
// import { assertEquals } from 'assert/equals'

// Deno.test('입력받기 without question', async () => {
//     const answers = ['Alice']
//     const session = new YaksokSession({
//         stdin: (question) => {
//             assertEquals(question, undefined)
//             return answers.shift() ?? ''
//         },
//     })

//     session.addModule(
//         'main',
//         `
// 이름 = 입력받기
// `,
//     )

//     await session.runModule('main')

//     const scope = session.entrypoint?.ranScope
//     const result = scope?.getVariable('이름') as StringValue

//     assertEquals(result.value, 'Alice')
// })

// Deno.test('질문과 함께 입력받기', async () => {
//     let receivedQuestion: string | undefined
//     const session = new YaksokSession({
//         stdin: (question) => {
//             receivedQuestion = question
//             return '30'
//         },
//     })

//     session.addModule(
//         'main',
//         `
// 나이 = '나이가 어떻게 되세요?' 입력받기
// `,
//     )

//     await session.runModule('main')

//     const scope = session.entrypoint?.ranScope
//     const result = scope?.getVariable('나이') as StringValue

//     assertEquals(receivedQuestion, '나이가 어떻게 되세요?')
//     assertEquals(result.value, '30')
// })

// Deno.test('동기 stdin 함수 지원', async () => {
//     const session = new YaksokSession({
//         stdin: (question) => {
//             assertEquals(question, undefined)
//             return '동기값'
//         },
//     })

//     session.addModule(
//         'main',
//         `
// 값 = 입력받기
// `,
//     )

//     await session.runModule('main')

//     const scope = session.entrypoint?.ranScope
//     const result = scope?.getVariable('값') as StringValue

//     assertEquals(result.value, '동기값')
// })

// Deno.test('null 반환 시 빈 문자열로 처리', async () => {
//     const session = new YaksokSession({
//         stdin: () => null as unknown as string,
//     })

//     session.addModule(
//         'main',
//         `
// 값 = 입력받기
// `,
//     )

//     await session.runModule('main')

//     const scope = session.entrypoint?.ranScope
//     const result = scope?.getVariable('값') as StringValue

//     assertEquals(result.value, '')
// })

// Deno.test('undefined 반환 시 빈 문자열로 처리', async () => {
//     const session = new YaksokSession({
//         stdin: () => undefined as unknown as string,
//     })

//     session.addModule(
//         'main',
//         `
// 값 = 입력받기
// `,
//     )

//     await session.runModule('main')

//     const scope = session.entrypoint?.ranScope
//     const result = scope?.getVariable('값') as StringValue

//     assertEquals(result.value, '')
// })

// Deno.test('stdin 함수에서 에러 발생 시 전파', async () => {
//     const session = new YaksokSession({
//         stdin: () => {
//             throw new Error('입력 에러')
//         },
//     })

//     session.addModule(
//         'main',
//         `
// 값 = 입력받기
// `,
//     )

//     let errorThrown = false
//     try {
//         await session.runModule('main')
//     } catch (error) {
//         errorThrown = true
//         assertEquals((error as Error).message, '입력 에러')
//     }

//     assertEquals(errorThrown, true)
// })
