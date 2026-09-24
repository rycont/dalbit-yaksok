import { assertIsError, unreachable } from '@std/assert'
import {
    IndexKeyNotFoundError,
    InvalidTypeForOperatorError,
    ListIndexMustBeGreaterOrEqualThan0Error,
    ListIndexTypeError,
    NotEnumerableValueForListLoopError,
    RangeEndMustBeIntegerError,
    RangeEndMustBeNumberError,
    RangeStartMustBeIntegerError,
    RangeStartMustBeLessThanEndError,
    RangeStartMustBeNumberError,
    TargetIsNotIndexedValueError,
} from '../../core/error/index.ts'
import { LoopCountIsNotNumberError } from '../../core/error/loop.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('Error raised in loop', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `
반복
    "Hello, world!" * "Hello, world!" 보여주기
    반복 그만
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, InvalidTypeForOperatorError)
    }
})

Deno.test('Error raised in list loop', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `
반복 [1, 2, 3] 의 숫자 마다
    "Hello, world!" * "Hello, world!" 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, InvalidTypeForOperatorError)
    }
})

Deno.test('Loop target is not enumerable', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `
반복 10의 숫자 마다
    숫자 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, NotEnumerableValueForListLoopError)
    }
})

Deno.test('Range start is less than end', async () => {
    const session = new YaksokSession()

    try {
        await session.addModule('main', `10 ~ 5`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, RangeStartMustBeLessThanEndError)
    }
})

Deno.test('Range start must be number', async () => {
    const session = new YaksokSession()

    try {
        await session.addModule('main', `"Hello" ~ 5`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, RangeStartMustBeNumberError)
    }
})

Deno.test('Range end must be number', async () => {
    const session = new YaksokSession()

    try {
        await session.addModule('main', `5 ~ "Hello"`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, RangeEndMustBeNumberError)
    }
})

Deno.test('Range start must be an integer', async () => {
    const session = new YaksokSession()

    try {
        await session.addModule('main', `1.5 ~ 5`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, RangeStartMustBeIntegerError)
    }

    const session2 = new YaksokSession()

    try {
        await session2.addModule('main', `1.5 ~ 3.2`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, RangeStartMustBeIntegerError)
    }
})

Deno.test('Range end must be an integer', async () => {
    const session = new YaksokSession()

    try {
        await session.addModule('main', `1 ~ 5.5`).run()
        unreachable()
    } catch (error) {
        assertIsError(error, RangeEndMustBeIntegerError)
    }
})

Deno.test('Index set target is must be indexable', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `목록 = 5
목록[1] = 10

목록 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, TargetIsNotIndexedValueError)
    }
})

Deno.test('Index get target is must be indexable', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `목록 = 5
목록[2] 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, TargetIsNotIndexedValueError)
    }
})

Deno.test('List out of range', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `목록 = [1, 2, 3]
목록[4] 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, IndexKeyNotFoundError)
    }
})

Deno.test('List index must be number', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `목록 = [1, 2, 3]
목록["Hello"] 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, ListIndexTypeError)
    }
})

Deno.test('List index must be integer', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `목록 = [1, 2, 3]
목록[1.5] 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, ListIndexTypeError)
    }
})

Deno.test('List index must bigger than 0', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `목록 = [1, 2, 3]
목록[-1] 보여주기
`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, ListIndexMustBeGreaterOrEqualThan0Error)
    }
})

Deno.test('Loop Count is not a number', async () => {
    const session = new YaksokSession()

    try {
        await session
            .addModule(
                'main',
                `반복 "Hello" 번
    1 + 1 보여주기`,
            )
            .run()

        unreachable()
    } catch (error) {
        assertIsError(error, LoopCountIsNotNumberError)
    }
})
