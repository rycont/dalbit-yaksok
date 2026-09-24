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
    const scope = await session.addModule('main', `결과 = '달빛'[1]`).run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '빛')
})

Deno.test('String index must be a non-negative integer within bounds', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, _machineReadable, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `결과 = '가'[-1]`)
    await codeFile.run()
    assertIsError(errors[0], ListIndexMustBeGreaterOrEqualThan0Error)

    const errors2: unknown[] = []
    const session2 = new YaksokSession({
        stderr(_message, _machineReadable, error) {
            errors2.push(error)
        },
    })
    const codeFile2 = session2.addModule('main', `결과 = '가'[0.5]`)
    await codeFile2.run()
    assertIsError(errors2[0], ListIndexTypeError)

    const errors3: unknown[] = []
    const session3 = new YaksokSession({
        stderr(_message, _machineReadable, error) {
            errors3.push(error)
        },
    })
    const codeFile3 = session3.addModule('main', `결과 = '가'[1]`)
    await codeFile3.run()
    assertIsError(errors3[0], StringIndexOutOfRangeError)
    assertEquals(
        errors3[0].message,
        '가에서 1번째 글자를 가져올 수 없어요. 가의 길이는 1이에요.',
    )
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
