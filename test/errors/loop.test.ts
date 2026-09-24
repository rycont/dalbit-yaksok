import { assert, assertIsError } from '@std/assert'
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
    session.addModule(
        'main',
        `
반복
    "Hello, world!" * "Hello, world!" 보여주기
    반복 그만
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], InvalidTypeForOperatorError)
})

Deno.test('Error raised in list loop', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
반복 [1, 2, 3] 의 숫자 마다
    "Hello, world!" * "Hello, world!" 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], InvalidTypeForOperatorError)
})

Deno.test('Loop target is not enumerable', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
반복 10의 숫자 마다
    숫자 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], NotEnumerableValueForListLoopError)
})

Deno.test('Range start is less than end', async () => {
    const session = new YaksokSession()
    session.addModule('main', `10 ~ 5`)
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], RangeStartMustBeLessThanEndError)
})

Deno.test('Range start must be number', async () => {
    const session = new YaksokSession()
    session.addModule('main', `"Hello" ~ 5`)
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], RangeStartMustBeNumberError)
})

Deno.test('Range end must be number', async () => {
    const session = new YaksokSession()
    session.addModule('main', `5 ~ "Hello"`)
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], RangeEndMustBeNumberError)
})

Deno.test('Range start must be an integer', async () => {
    const session = new YaksokSession()
    session.addModule('main', `1.5 ~ 5`)
    let result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], RangeStartMustBeIntegerError)

    const session2 = new YaksokSession()
    session2.addModule('main', `1.5 ~ 3.2`)
    result = (await session2.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], RangeStartMustBeIntegerError)
})

Deno.test('Range end must be an integer', async () => {
    const session = new YaksokSession()
    session.addModule('main', `1 ~ 5.5`)
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], RangeEndMustBeIntegerError)
})

Deno.test('Index set target is must be indexable', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `목록 = 5
목록[1] = 10

목록 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], TargetIsNotIndexedValueError)
})

Deno.test('Index get target is must be indexable', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `목록 = 5
목록[2] 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], TargetIsNotIndexedValueError)
})

Deno.test('List out of range', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록[4] 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], IndexKeyNotFoundError)
})

Deno.test('List index must be number', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록["Hello"] 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], ListIndexTypeError)
})

Deno.test('List index must be integer', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록[1.5] 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], ListIndexTypeError)
})

Deno.test('List index must bigger than 0', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `목록 = [1, 2, 3]
목록[-1] 보여주기
`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], ListIndexMustBeGreaterOrEqualThan0Error)
})

Deno.test('Loop Count is not a number', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `반복 "Hello" 번
    1 + 1 보여주기`,
    )
    const result = (await session.runModules(['main'])).main
    assert(
        result.reason === 'error',
        `Expected an error, but got ${result.reason}`,
    )
    assertIsError(result.errors?.[0], LoopCountIsNotNumberError)
})
