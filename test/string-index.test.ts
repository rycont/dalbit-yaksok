import { assert } from '@std/assert'
import { assertEquals } from 'assert/equals'
import { assertInstanceOf } from 'assert/instance-of'
import { assertIsError } from 'assert/is-error'
import {
    ListIndexMustBeGreaterOrEqualThan0Error,
    ListIndexTypeError,
    ListValue,
    StringIndexOutOfRangeError,
    StringValue,
    yaksok,
} from '../core/mod.ts'

Deno.test('String allows indexing by number', async () => {
    const result = await yaksok(`결과 = '달빛'[1]`)
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.codeFile.ranScope!
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '빛')
})

Deno.test('String index must be a non-negative integer within bounds', async () => {
    const negativeResult = await yaksok(`결과 = '가'[-1]`)
    assert(
        negativeResult.reason === 'error',
        `Expected error, got ${negativeResult.reason}`,
    )
    assertIsError(
        negativeResult.error,
        ListIndexMustBeGreaterOrEqualThan0Error,
    )

    const decimalResult = await yaksok(`결과 = '가'[0.5]`)
    assert(
        decimalResult.reason === 'error',
        `Expected error, got ${decimalResult.reason}`,
    )
    assertIsError(decimalResult.error, ListIndexTypeError)

    const outOfRangeResult = await yaksok(`결과 = '가'[1]`)
    assert(
        outOfRangeResult.reason === 'error',
        `Expected error, got ${outOfRangeResult.reason}`,
    )
    assertIsError(outOfRangeResult.error, StringIndexOutOfRangeError)
    assertEquals(
        outOfRangeResult.error.message,
        "가에서 1번째 글자를 가져올 수 없어요. 가의 길이는 1이에요.",
    )
})

Deno.test('String variables can be indexed', async () => {
    const result = await yaksok(`대상 = '달빛'\n결과 = 대상[1]`)
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.codeFile.ranScope!
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '빛')
})

Deno.test('List indexing supports multiple indexes', async () => {
    const result = await yaksok(`결과 = ['가', '나', '다'][[0, 2]]`)
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.codeFile.ranScope!
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, ListValue)

    const values = [...stored.entries.values()].map((value) => {
        assertInstanceOf(value, StringValue)
        return value.value
    })

    assertEquals(values, ['가', '다'])
})
