import { assertEquals } from 'assert/equals'
import { assertInstanceOf } from 'assert/instance-of'
import { assertIsError } from 'assert/is-error'
import {
    BooleanValue,
    InvalidTypeForOperatorError,
    ListValue,
    NumberValue,
    YaksokSession,
} from '../core/mod.ts'

Deno.test('List multiplied by integer repeats elements', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = [참] * 3`).run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, ListValue)

    const elements = Array.from(stored.enumerate())
    assertEquals(elements.length, 3)

    for (const element of elements) {
        assertInstanceOf(element, BooleanValue)
        assertEquals(element.value, true)
    }
})

Deno.test('Number multiplied by list repeats list elements', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = 3 * [1, 2]`).run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, ListValue)

    const elements = Array.from(stored.enumerate())
    assertEquals(elements.length, 6)

    const numericValues = elements.map((element) => {
        assertInstanceOf(element, NumberValue)
        return element.value
    })

    assertEquals(numericValues, [1, 2, 1, 2, 1, 2])
})

Deno.test('List multiplication requires non-negative integers', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `결과 = [1] * -1`)
    await codeFile.run()
    assertIsError(errors[0], InvalidTypeForOperatorError)

    const errors2: unknown[] = []
    const session2 = new YaksokSession({
        stderr(_message, error) {
            errors2.push(error)
        },
    })
    const codeFile2 = session2.addModule('main', `결과 = [1] * 2.5`)
    await codeFile2.run()
    assertIsError(errors2[0], InvalidTypeForOperatorError)
})
