import { YaksokSession } from '../core/mod.ts'
import { assertEquals, assert, assertInstanceOf } from '@std/assert'
import {
    NumberValue,
    StringValue,
    BooleanValue,
} from '../core/value/primitive.ts'
import { InvalidTypeCastError } from '../core/error/typecast.ts'

Deno.test('문자열을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "123" 을 숫자로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as NumberValue
    assertEquals(result.value, 123)
})

Deno.test('문자열(소수)을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "3.14" 를 숫자로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as NumberValue
    assertEquals(result.value, 3.14)
})

Deno.test('숫자를 문자열로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 123 을 문자열로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '123')
})

Deno.test('숫자를 문자로 바꾸기 (별칭)', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 456 를 문자로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '456')
})

Deno.test('참을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 참 을 숫자로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as NumberValue
    assertEquals(result.value, 1)
})

Deno.test('거짓을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 거짓 을 숫자로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as NumberValue
    assertEquals(result.value, 0)
})

Deno.test('문자열 "참"을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "참" 을 참거짓으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, true)
})

Deno.test('문자열 "거짓"을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "거짓" 을 참거짓으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, false)
})

Deno.test('문자열 "true"를 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "true" 를 참거짓으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, true)
})

Deno.test('빈 문자열을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "" 을 참거짓으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, false)
})

Deno.test('비어있지 않은 문자열을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "hello" 를 참거짓으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, true)
})

Deno.test('숫자 0을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 0 을 참거짓으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, false)
})

Deno.test('숫자 1을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 1 을 참거짓으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, true)
})

Deno.test('참거짓을 문자열로 바꾸기', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 참 을 문자열로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '참')
})

Deno.test('변수와 함께 사용', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
나이_문자열 = "25"
나이 = 나이_문자열 을 숫자로 바꾸기
결과 = 나이 + 5
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as NumberValue
    assertEquals(result.value, 30)
})

Deno.test('잘못된 문자열을 숫자로 바꾸기 시도', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = "abc" 를 숫자로 바꾸기`)
    const results = await session.runModule('main')
    const result = results.get('main')!
    assert(result.reason === 'error')
    assertInstanceOf(result.error, InvalidTypeCastError)
})

Deno.test('불리언으로 바꾸기 (별칭)', async () => {
    const session = new YaksokSession()
    session.addModule('main', `결과 = 1 을 불리언으로 바꾸기`)
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as BooleanValue
    assertEquals(result.value, true)
})
