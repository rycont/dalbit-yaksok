import { assert, assertIsError } from '@std/assert'
import {
    UnexpectedEndOfCodeError,
    UnexpectedTokenError,
} from '../../core/error/index.ts'
import { YaksokSession } from '../../core/mod.ts'

Deno.test('온전하지 않은 약속 정의', async () => {
    const session = new YaksokSession()
    session.addModule('main', `약속, (A)와 (`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedEndOfCodeError)
})

Deno.test('온전하지 않은 약속 정의: 조사 변형이 안끝남', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `약속, (A)와/
A 보여주기`,
    )
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
})

Deno.test('약속 정의 문법이 틀림', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `약속, (A)와 (((((
"여보세요?" 보여주기
`,
    )
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedTokenError)
})

Deno.test('온전하지 않은 번역: 정의가 없음', async () => {
    const session = new YaksokSession()
    session.addModule('main', `번역(Runtime),`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
    assertIsError(result.errors![0], UnexpectedEndOfCodeError)
})

Deno.test('온전하지 않은 번역: 사실 번역이 아님', async () => {
    const session = new YaksokSession()
    session.addModule('main', `번역 이라고 할 뻔 했지만 사실 번역이 아니라는거`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
})

Deno.test('온전하지 않은 번역: 런타임이 이상함', async () => {
    const session = new YaksokSession()
    session.addModule('main', `번역(1010), (이름) 물어보기`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
})

Deno.test('온전하지 않은 번역: 런타임이 안끝남', async () => {
    const session = new YaksokSession()
    session.addModule('main', `번역(Python 3), 파이썬3 실행하기`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
})

Deno.test('온전하지 않은 번역: 반점이 안들어감', async () => {
    const session = new YaksokSession()
    session.addModule('main', `번역(Python) print는 약속에서 보여주기`)
    const result = (await session.runModule(['main'])).main
    assert(result.reason === 'validation')
})
