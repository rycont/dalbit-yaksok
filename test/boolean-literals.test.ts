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