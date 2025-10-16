import { YaksokSession } from '../core/mod.ts'
import { assertEquals } from 'assert/equals'
import { BooleanValue } from '../core/value/primitive.ts'

const TRUE_LITERALS = ['참', '맞음', 'True', 'true']
const FALSE_LITERALS = ['거짓', '아님', 'False', 'false']

for (const literal of TRUE_LITERALS) {
    Deno.test(literal, async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
결과 = ${literal}
`,
        )
        await session.runModule('main')
        const result = session.entrypoint?.ranScope?.getVariable('결과') as BooleanValue
        assertEquals(result.value, true)
    })
}

for (const literal of FALSE_LITERALS) {
    Deno.test(literal, async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
결과 = ${literal}
`,
        )
        await session.runModule('main')
        const result = session.entrypoint?.ranScope?.getVariable('결과') as BooleanValue
        assertEquals(result.value, false)
    })
}

Deno.test('Store boolean in variable', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
불리언 = 참
결과 = 불리언
`,
    )
    await session.runModule('main')
    const result = session.entrypoint?.ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, true)
})

Deno.test('Compare booleans', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
결과1 = 참 == 참
결과2 = 거짓 == 거짓
결과3 = 참 == 거짓
결과4 = 참 != 거짓
`,
    )
    await session.runModule('main')
    const scope = session.entrypoint?.ranScope
    assertEquals((scope?.getVariable('결과1') as BooleanValue).value, true)
    assertEquals((scope?.getVariable('결과2') as BooleanValue).value, true)
    assertEquals((scope?.getVariable('결과3') as BooleanValue).value, false)
    assertEquals((scope?.getVariable('결과4') as BooleanValue).value, true)
})

Deno.test('Negation operator', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
결과1 = 참 아니다
결과2 = 거짓 아니다
결과3 = 1 == 1 아니다
불리언 = 참
결과4 = 불리언 아니다
`,
    )
    await session.runModule('main')
    const scope = session.entrypoint?.ranScope
    assertEquals((scope?.getVariable('결과1') as BooleanValue).value, false)
    assertEquals((scope?.getVariable('결과2') as BooleanValue).value, true)
    assertEquals((scope?.getVariable('결과3') as BooleanValue).value, false)
    assertEquals((scope?.getVariable('결과4') as BooleanValue).value, false)
})