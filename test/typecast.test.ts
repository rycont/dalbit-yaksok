import {
    YaksokSession,
    NumberValue,
    StringValue,
    BooleanValue,
    InvalidTypeCastError,
} from '@dalbit-yaksok/core'

import { test, expect } from 'vite-plus/test'

test('문자열을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "123" 을 숫자로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, NumberValue)
    expect(variable.value).toBe(123)
})

test('문자열(소수)을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "3.14" 를 숫자로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, NumberValue)
    expect(variable.value).toBe(3.14)
})

test('숫자를 문자열로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 123 을 문자열로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, StringValue)
    expect(variable.value).toBe('123')
})

test('숫자를 문자로 바꾸기 (별칭)', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 456 를 문자로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, StringValue)
    expect(variable.value).toBe('456')
})

test('참을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 참 을 숫자로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, NumberValue)
    expect(variable.value).toBe(1)
})

test('거짓을 숫자로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 거짓 을 숫자로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, NumberValue)
    expect(variable.value).toBe(0)
})

test('문자열 "참"을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "참" 을 참거짓으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(true)
})

test('문자열 "거짓"을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "거짓" 을 참거짓으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(false)
})

test('문자열 "true"를 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "true" 를 참거짓으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(true)
})

test('빈 문자열을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "" 을 참거짓으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(false)
})

test('비어있지 않은 문자열을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "hello" 를 참거짓으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(true)
})

test('숫자 0을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 0 을 참거짓으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(false)
})

test('숫자 1을 참거짓으로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 1 을 참거짓으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(true)
})

test('참거짓을 문자열로 바꾸기', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 참 을 문자열로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, StringValue)
    expect(variable.value).toBe('참')
})

test('변수와 함께 사용', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule(
            'main',
            `
나이_문자열 = "25"
나이 = 나이_문자열 을 숫자로 바꾸기
결과 = 나이 + 5
`,
        )
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, NumberValue)
    expect(variable.value).toBe(30)
})

test('잘못된 문자열을 숫자로 바꾸기 시도', async () => {
    const errors: unknown[] = []
    const session = new YaksokSession({
        stderr(_message, error) {
            errors.push(error)
        },
    })
    const codeFile = session.addModule('main', `결과 = "abc" 를 숫자로 바꾸기`)
    await codeFile.run()
    expect.assert.instanceOf(errors[0], InvalidTypeCastError)
})

test('불리언으로 바꾸기 (별칭)', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = 1 을 불리언으로 바꾸기`)
        .run()
    const variable = scope.getVariable('결과')

    expect.assert.instanceOf(variable, BooleanValue)
    expect(variable.value).toBe(true)
})
