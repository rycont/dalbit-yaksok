import { assertEquals } from 'assert/equals'
import { assertInstanceOf } from 'assert/instance-of'
import { assertIsError } from 'assert/is-error'
import { unreachable } from '@std/assert'
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
    const session = new YaksokSession()

    try {
        await session.addModule('main', `결과 = [1] * -1`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, InvalidTypeForOperatorError)
    }

    const session2 = new YaksokSession()

    try {
        await session2.addModule('main', `결과 = [1] * 2.5`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, InvalidTypeForOperatorError)
    }
})
