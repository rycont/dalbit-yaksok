import { assertIsError, unreachable } from '@std/assert'
import { yaksok } from '../../core/mod.ts'
import {
    InvalidTypeForOperatorError,
    IndexOutOfRangeError,
    ListIndexTypeError,
    NotEnumerableValueForListLoopError,
    RangeEndMustBeNumberError,
    RangeStartMustBeLessThanEndError,
    RangeStartMustBeNumberError,
    RangeStartMustBeIntegerError,
    RangeEndMustBeIntegerError,
    TargetIsNotIndexedValueError,
    ListIndexMustBeGreaterThan1Error,
} from '../../core/error/index.ts'

Deno.test('Error raised in loop', async () => {
    try {
        await yaksok(`
반복
    "Hello, world!" * "Hello, world!" 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, InvalidTypeForOperatorError)
    }
})

Deno.test('Error raised in list loop', async () => {
    try {
        await yaksok(`
반복 [1, 2, 3]의 숫자 마다
    "Hello, world!" * "Hello, world!" 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, InvalidTypeForOperatorError)
    }
})

Deno.test('Loop target is not enumerable', async () => {
    try {
        await yaksok(`
반복 10의 숫자 마다
    숫자 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, NotEnumerableValueForListLoopError)
    }
})

Deno.test('Range start is less than end', async () => {
    try {
        await yaksok(`10 ~ 5`)
        unreachable()
    } catch (e) {
        assertIsError(e, RangeStartMustBeLessThanEndError)
    }
})

Deno.test('Range start must be number', async () => {
    try {
        await yaksok(`"Hello" ~ 5`)
        unreachable()
    } catch (e) {
        assertIsError(e, RangeStartMustBeNumberError)
    }
})

Deno.test('Range end must be number', async () => {
    try {
        await yaksok(`5 ~ "Hello"`)
        unreachable()
    } catch (e) {
        assertIsError(e, RangeEndMustBeNumberError)
    }
})

Deno.test('Range start must be an integer', async () => {
    try {
        await yaksok(`1.5 ~ 5`)
        unreachable()
    } catch (e) {
        assertIsError(e, RangeStartMustBeIntegerError)
    }

    try {
        await yaksok(`1.5 ~ 3.2`)
        unreachable()
    } catch (e) {
        assertIsError(e, RangeStartMustBeIntegerError)
    }
})

Deno.test('Range end must be an integer', async () => {
    try {
        await yaksok(`1 ~ 5.5`)
        unreachable()
    } catch (e) {
        assertIsError(e, RangeEndMustBeIntegerError)
    }
})

Deno.test('Index set target is must be indexable', async () => {
    try {
        await yaksok(`목록: 5
목록[1]: 10

목록 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, TargetIsNotIndexedValueError)
    }
})

Deno.test('Index get target is must be indexable', async () => {
    try {
        await yaksok(`목록: 5
목록[2] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, TargetIsNotIndexedValueError)
    }
})

Deno.test('List out of range', async () => {
    try {
        await yaksok(`목록: [1, 2, 3]
목록[4] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, IndexOutOfRangeError)
    }
})

Deno.test('List index must be number', async () => {
    try {
        await yaksok(`목록: [1, 2, 3]
목록["Hello"] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, ListIndexTypeError)
    }
})

Deno.test('List index must be integer', async () => {
    try {
        await yaksok(`목록: [1, 2, 3]
목록[1.5] 보여주기
`)
        unreachable()
    } catch (e) {
        console.log(e)
        assertIsError(e, ListIndexTypeError)
    }
})

Deno.test('List index must bigger than 1', async () => {
    try {
        await yaksok(`목록: [1, 2, 3]
목록[0] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, ListIndexMustBeGreaterThan1Error)
    }
})
