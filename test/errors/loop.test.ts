import { assert, assertIsError } from '@std/assert'
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
import {
    LoopCountIsNotNumberError,
    NoBreakOrReturnError,
} from '../../core/error/loop.ts'
import { yaksok } from '../../core/mod.ts'
import { YaksokSession } from '../../core/session/session.ts'

Deno.test('Error raised in loop', async () => {
    const result = await yaksok(`
반복
    "Hello, world!" * "Hello, world!" 보여주기
    반복 그만
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, InvalidTypeForOperatorError)
})

Deno.test('Error raised in list loop', async () => {
    const result = await yaksok(`
반복 [1, 2, 3]의 숫자 마다
    "Hello, world!" * "Hello, world!" 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, InvalidTypeForOperatorError)
})

Deno.test('Loop target is not enumerable', async () => {
    const result = await yaksok(`
반복 10의 숫자 마다
    숫자 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, NotEnumerableValueForListLoopError)
})

Deno.test('Range start is less than end', async () => {
    const result = await yaksok(`10 ~ 5`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, RangeStartMustBeLessThanEndError)
})

Deno.test('Range start must be number', async () => {
    const result = await yaksok(`"Hello" ~ 5`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, RangeStartMustBeNumberError)
})

Deno.test('Range end must be number', async () => {
    const result = await yaksok(`5 ~ "Hello"`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, RangeEndMustBeNumberError)
})

Deno.test('Range start must be an integer', async () => {
    let result = await yaksok(`1.5 ~ 5`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, RangeStartMustBeIntegerError)

    result = await yaksok(`1.5 ~ 3.2`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, RangeStartMustBeIntegerError)
})

Deno.test('Range end must be an integer', async () => {
    const result = await yaksok(`1 ~ 5.5`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, RangeEndMustBeIntegerError)
})

Deno.test('Index set target is must be indexable', async () => {
    const result = await yaksok(`목록 = 5
목록[1] = 10

목록 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, TargetIsNotIndexedValueError)
})

Deno.test('Index get target is must be indexable', async () => {
    const result = await yaksok(`목록 = 5
목록[2] 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, TargetIsNotIndexedValueError)
})

Deno.test('List out of range', async () => {
    const result = await yaksok(`목록 = [1, 2, 3]
목록[4] 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, IndexOutOfRangeError)
})

Deno.test('List index must be number', async () => {
    const result = await yaksok(`목록 = [1, 2, 3]
목록["Hello"] 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, ListIndexTypeError)
})

Deno.test('List index must be integer', async () => {
    const result = await yaksok(`목록 = [1, 2, 3]
목록[1.5] 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, ListIndexTypeError)
})

Deno.test('List index must bigger than 0', async () => {
    const result = await yaksok(`목록 = [1, 2, 3]
목록[-1] 보여주기
`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, ListIndexMustBeGreaterOrEqualThan0Error)
})

Deno.test('No break or return in loop', async () => {
    const result = await yaksok(`반복
    1 + 1 보여주기`)
    assert(
        result.reason === 'validation',
        `Expected an validation, but got ${result.reason}`,
    )
    assertIsError(result.errors.get('main')![0], NoBreakOrReturnError)
})

Deno.test('Skip validating break or return in loop', async () => {
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
    const result = await session.runModule('main')

    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, YaksokError)
    assertIsError(result.error, InvalidTypeForOperatorError)
})

Deno.test('Loop Count is not a number', async () => {
    const result = await yaksok(`반복 "Hello" 번
    1 + 1 보여주기`)
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.error, LoopCountIsNotNumberError)
})
