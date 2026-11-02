import {
    BooleanValue,
    InvalidTypeForOperatorError,
    ListValue,
    NumberValue,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('List multiplied by integer repeats elements', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = [참] * 3`).run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, ListValue)

    const elements = Array.from(stored.enumerate())
    expect(elements.length).toBe(3)

    for (const element of elements) {
        expect.assert.instanceOf(element, BooleanValue)
        expect(element.value).toBe(true)
    }
})

test('Number multiplied by list repeats list elements', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = 3 * [1, 2]`).run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, ListValue)

    const elements = Array.from(stored.enumerate())
    expect(elements.length).toBe(6)

    const numericValues = elements.map((element) => {
        expect.assert.instanceOf(element, NumberValue)
        return element.value
    })

    expect(numericValues).toStrictEqual([1, 2, 1, 2, 1, 2])
})

test('List multiplication requires non-negative integers', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `결과 = [1] * -1`)
    await codeFile.run()
    expect(errors[0]).toBeInstanceOf(InvalidTypeForOperatorError)

    const errors2: unknown[] = []
    const session2 = new YaksokSession({
        stderr(_message, error) {
            errors2.push(error)
        },
    })
    const codeFile2 = session2.addModule('main', `결과 = [1] * 2.5`)
    await codeFile2.run()
    expect(errors2[0]).toBeInstanceOf(InvalidTypeForOperatorError)
})
