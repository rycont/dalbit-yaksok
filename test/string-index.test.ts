import {
    ListIndexMustBeGreaterOrEqualThan0Error,
    ListIndexTypeError,
    ListValue,
    StringIndexOutOfRangeError,
    StringValue,
    YaksokSession,
} from '@dalbit-yaksok/core'

import { expect, test } from 'vite-plus/test'

test('String allows indexing by number', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = '달빛'[1]`).run()

    const stored = scope.getVariable('결과')

    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('빛')
})

test('String index must be a non-negative integer within bounds', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `결과 = '가'[-1]`)
    await codeFile.run()

    expect(errors[0]).instanceOf(ListIndexMustBeGreaterOrEqualThan0Error)

    const errors2: unknown[] = []
    const session2 = new YaksokSession({
        stderr(_message, error) {
            errors2.push(error)
        },
    })
    const codeFile2 = session2.addModule('main', `결과 = '가'[0.5]`)
    await codeFile2.run()
    expect(errors2[0]).toBeInstanceOf(ListIndexTypeError)

    const errors3: unknown[] = []
    const session3 = new YaksokSession({
        stderr(_message, error) {
            errors3.push(error)
        },
    })
    const codeFile3 = session3.addModule('main', `결과 = '가'[1]`)
    await codeFile3.run()

    expect.assert.instanceOf(errors3[0], StringIndexOutOfRangeError)
    expect(errors3[0].message).toBe(
        '가에서 1번째 글자를 가져올 수 없어요. 가의 길이는 1이에요.',
    )
})

test('String variables can be indexed', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `대상 = '달빛'\n결과 = 대상[1]`)
        .run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('빛')
})

test('List indexing supports multiple indexes', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = ['가', '나', '다'][[0, 2]]`)
        .run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, ListValue)

    const values = [...stored.entries.values()].map((value) => {
        expect.assert.instanceOf(value, StringValue)
        return value.value
    })

    expect(values).toStrictEqual(['가', '다'])
})
