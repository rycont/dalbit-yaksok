import { assert } from '@std/assert'
import { assertEquals } from 'assert/equals'
import { assertInstanceOf } from 'assert/instance-of'
import { assertIsError } from 'assert/is-error'
import {
    BooleanValue,
    InvalidTypeForOperatorError,
    ListValue,
    NumberValue,
    yaksok,
} from '../core/mod.ts'

Deno.test('List multiplied by integer repeats elements', async () => {
    const result = await yaksok(`결과 = [참] * 3`)
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.codeFile.ranScope!
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
    const result = await yaksok(`결과 = 3 * [1, 2]`)
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.codeFile.ranScope!
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
    const negativeResult = await yaksok(`결과 = [1] * -1`)
    assert(
        negativeResult.reason === 'error',
        `Expected error, got ${negativeResult.reason}`,
    )
    assertIsError(negativeResult.error, InvalidTypeForOperatorError)

    const decimalResult = await yaksok(`결과 = [1] * 2.5`)
    assert(
        decimalResult.reason === 'error',
        `Expected error, got ${decimalResult.reason}`,
    )
    assertIsError(decimalResult.error, InvalidTypeForOperatorError)
})
