import { assert } from '@std/assert'
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
    session.addModule('main', `결과 = [참] * 3`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.scope!
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
    session.addModule('main', `결과 = 3 * [1, 2]`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.scope!
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
    session.addModule('main', `결과 = [1] * -1`)
    const negativeResult = (await session.runModules(['main'])).main
    assert(
        negativeResult.reason === 'error',
        `Expected error, got ${negativeResult.reason}`,
    )
    assertIsError(negativeResult.errors?.[0], InvalidTypeForOperatorError)

    const session2 = new YaksokSession()
    session2.addModule('main', `결과 = [1] * 2.5`)
    const decimalResult = (await session2.runModules(['main'])).main
    assert(
        decimalResult.reason === 'error',
        `Expected error, got ${decimalResult.reason}`,
    )
    assertIsError(decimalResult.errors?.[0], InvalidTypeForOperatorError)
})
