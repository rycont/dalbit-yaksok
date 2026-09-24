import { assertEquals } from 'assert/equals'
import { assertInstanceOf } from 'assert/instance-of'
import { assertIsError } from 'assert/is-error'
import { unreachable } from '@std/assert'
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
    const scope = await session.addModule('main', `결과 = '달빛'[1]`).run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '빛')
})

Deno.test('String index must be a non-negative integer within bounds', async () => {
    const session = new YaksokSession()

    try {
        await session.addModule('main', `결과 = '가'[-1]`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, ListIndexMustBeGreaterOrEqualThan0Error)
    }

    const session2 = new YaksokSession()

    try {
        await session2.addModule('main', `결과 = '가'[0.5]`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, ListIndexTypeError)
    }

    const session3 = new YaksokSession()

    try {
        await session3.addModule('main', `결과 = '가'[1]`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, StringIndexOutOfRangeError)
        assertEquals(
            error.message,
            '가에서 1번째 글자를 가져올 수 없어요. 가의 길이는 1이에요.',
        )
    }
})

Deno.test('String variables can be indexed', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `대상 = '달빛'\n결과 = 대상[1]`)
        .run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '빛')
})

Deno.test('List indexing supports multiple indexes', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = ['가', '나', '다'][[0, 2]]`)
        .run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, ListValue)

    const values = [...stored.entries.values()].map((value) => {
        assertInstanceOf(value, StringValue)
        return value.value
    })

    assertEquals(values, ['가', '다'])
})
