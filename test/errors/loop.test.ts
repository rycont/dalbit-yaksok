import { assertIsError, unreachable } from '@std/assert'
import { YaksokError } from '../../core/error/common.ts'
import {
    IndexOutOfRangeError,
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
import { NoBreakOrReturnError } from '../../core/error/loop.ts'
import { ErrorGroups } from '../../core/error/validation.ts'
import { yaksok } from '../../core/mod.ts'
import { YaksokSession } from '../../core/session/session.ts'

Deno.test('Error raised in loop', async () => {
    try {
        await yaksok(`
반복
    "Hello, world!" * "Hello, world!" 보여주기
    반복 그만
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
        await yaksok(`목록 = 5
목록[1] = 10

목록 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, TargetIsNotIndexedValueError)
    }
})

Deno.test('Index get target is must be indexable', async () => {
    try {
        await yaksok(`목록 = 5
목록[2] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, TargetIsNotIndexedValueError)
    }
})

Deno.test('List out of range', async () => {
    try {
        await yaksok(`목록 = [1, 2, 3]
목록[4] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, IndexOutOfRangeError)
    }
})

Deno.test('List index must be number', async () => {
    try {
        await yaksok(`목록 = [1, 2, 3]
목록["Hello"] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, ListIndexTypeError)
    }
})

Deno.test('List index must be integer', async () => {
    try {
        await yaksok(`목록 = [1, 2, 3]
목록[1.5] 보여주기
`)
        unreachable()
    } catch (e) {
        console.log(e)
        assertIsError(e, ListIndexTypeError)
    }
})

Deno.test('List index must bigger than 0', async () => {
    try {
        await yaksok(`목록 = [1, 2, 3]
목록[-1] 보여주기
`)
        unreachable()
    } catch (e) {
        assertIsError(e, ListIndexMustBeGreaterOrEqualThan0Error)
    }
})

Deno.test('No break or return in loop', async () => {
    try {
        await yaksok(`반복
    1 + 1 보여주기`)
        unreachable()
    } catch (e) {
        assertIsError(e, ErrorGroups)
        assertIsError(e.errors.get('main')![0], NoBreakOrReturnError)
    }
})

Deno.test('Skip validating break or return in loop', async () => {
    try {
        const code = `
순서 = 0
반복
    순서 = 순서 + 1
    만약 순서 == 3 이면
        [] / 2 보여주기`
        const session = new YaksokSession({
            flags: {
                'skip-validate-break-or-return-in-loop': true,
            },
        })

        session.addModule('main', code)
        await session.runModule('main')

        unreachable()
    } catch (e) {
        assertIsError(e, YaksokError)
        assertIsError(e, InvalidTypeForOperatorError)
    }
})
