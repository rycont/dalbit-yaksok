import {
    YaksokSession,
    InvalidTypeForOperatorError,
    NotEnumerableValueForListLoopError,
    RangeStartMustBeLessThanEndError,
    RangeStartMustBeNumberError,
    RangeEndMustBeNumberError,
    RangeStartMustBeIntegerError,
    RangeEndMustBeIntegerError,
    TargetIsNotIndexedValueError,
    IndexKeyNotFoundError,
    ListIndexTypeError,
    ListIndexMustBeGreaterOrEqualThan0Error,
    LoopCountIsNotNumberError,
} from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('Error raised in loop', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `
반복
    "Hello, world!" * "Hello, world!" 보여주기
    반복 그만
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], InvalidTypeForOperatorError)
})

test('Error raised in list loop', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `
반복 [1, 2, 3] 의 숫자 마다
    "Hello, world!" * "Hello, world!" 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], InvalidTypeForOperatorError)
})

test('Loop target is not enumerable', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `
반복 10의 숫자 마다
    숫자 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], NotEnumerableValueForListLoopError)
})

test('Range start is less than end', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `10 ~ 5`)
    await codeFile.run()
    expect.assert.instanceOf(errors[0], RangeStartMustBeLessThanEndError)
})

test('Range start must be number', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `"Hello" ~ 5`)
    await codeFile.run()
    expect.assert.instanceOf(errors[0], RangeStartMustBeNumberError)
})

test('Range end must be number', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `5 ~ "Hello"`)
    await codeFile.run()
    expect.assert.instanceOf(errors[0], RangeEndMustBeNumberError)
})

test('Range start must be an integer', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `1.5 ~ 5`)
    await codeFile.run()
    expect.assert.instanceOf(errors[0], RangeStartMustBeIntegerError)

    const errors2: unknown[] = []
    const session2 = new YaksokSession({
        stderr(_message, error) {
            errors2.push(error)
        },
    })
    const codeFile2 = session2.addModule('main', `1.5 ~ 3.2`)
    await codeFile2.run()
    expect.assert.instanceOf(errors2[0], RangeStartMustBeIntegerError)
})

test('Range end must be an integer', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `1 ~ 5.5`)
    await codeFile.run()
    expect.assert.instanceOf(errors[0], RangeEndMustBeIntegerError)
})

test('Index set target is must be indexable', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `목록 = 5
목록[1] = 10

목록 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], TargetIsNotIndexedValueError)
})

test('Index get target is must be indexable', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `목록 = 5
목록[2] 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], TargetIsNotIndexedValueError)
})

test('List out of range', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록[4] 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], IndexKeyNotFoundError)
})

test('List index must be number', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록["Hello"] 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], ListIndexTypeError)
})

test('List index must be integer', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록[1.5] 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], ListIndexTypeError)
})

test('List index must bigger than 0', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록[-1] 보여주기
`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], ListIndexMustBeGreaterOrEqualThan0Error)
})

test('Loop Count is not a number', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule(
        'main',
        `반복 "Hello" 번
    1 + 1 보여주기`,
    )
    await codeFile.run()
    expect.assert.instanceOf(errors[0], LoopCountIsNotNumberError)
})
