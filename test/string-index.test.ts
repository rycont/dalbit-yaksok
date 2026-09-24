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
    YaksokSession,
} from '../core/mod.ts'

Deno.test('String allows indexing by number', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = '달빛'[1]`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.scope!
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '빛')
})

Deno.test('String index must be a non-negative integer within bounds', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = '가'[-1]`)
    const negativeResult = (await session.runModules(['main'])).main
    assert(
        negativeResult.reason === 'error',
        `Expected error, got ${negativeResult.reason}`,
    )
    assertIsError(
        negativeResult.errors?.[0],
        ListIndexMustBeGreaterOrEqualThan0Error,
    )

    const session2 = new YaksokSession()
    session2.addModule('main', `결과 = '가'[0.5]`)
    const decimalResult = (await session2.runModules(['main'])).main
    assert(
        decimalResult.reason === 'error',
        `Expected error, got ${decimalResult.reason}`,
    )
    assertIsError(decimalResult.errors?.[0], ListIndexTypeError)

    const session3 = new YaksokSession()
    session3.addModule('main', `결과 = '가'[1]`)
    const outOfRangeResult = (await session3.runModules(['main'])).main
    assert(
        outOfRangeResult.reason === 'error',
        `Expected error, got ${outOfRangeResult.reason}`,
    )
    assertIsError(outOfRangeResult.errors?.[0], StringIndexOutOfRangeError)
    assertEquals(
        outOfRangeResult.errors?.[0]?.message,
        '가에서 1번째 글자를 가져올 수 없어요. 가의 길이는 1이에요.',
    )
})

Deno.test('String variables can be indexed', async () => {
    const session = new YaksokSession()
    session.addModule('main', `대상 = '달빛'\n결과 = 대상[1]`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.scope!
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '빛')
})

Deno.test('List indexing supports multiple indexes', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = ['가', '나', '다'][[0, 2]]`)
    const result = (await session.runModules(['main'])).main
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)

    const scope = result.scope!
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, ListValue)

    const values = [...stored.entries.values()].map((value) => {
        assertInstanceOf(value, StringValue)
        return value.value
    })

    assertEquals(values, ['가', '다'])
})
