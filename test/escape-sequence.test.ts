import { YaksokSession, StringValue } from '@dalbit-yaksok/core'
import { test, expect } from 'vite-plus/test'

test('Escape sequence: double quote inside string', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = "안녕\\"!"`).run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('안녕"!')
})

test('Escape sequence: single quote inside string', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = '작은\\' 따옴표'`)
        .run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe("작은' 따옴표")
})

test('Escape sequence: backslash', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = "경로\\\\파일"`).run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('경로\\파일')
})

test('Escape sequence: newline', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "첫줄\\n둘째줄"`)
        .run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('첫줄\n둘째줄')
})

test('Escape sequence: tab', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = "탭\\t문자"`).run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('탭\t문자')
})

test('Escape sequence: carriage return', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "캐리지\\r리턴"`)
        .run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('캐리지\r리턴')
})

test('Escape sequence: multiple escapes in one string', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "He said \\"Hello\\", then\\nleft."`)
        .run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('He said "Hello", then\nleft.')
})

test('Escape sequence: unknown escape is preserved', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "알 수 없는 \\x 이스케이프"`)
        .run()
    const stored = scope.getVariable('결과')
    expect.assert.instanceOf(stored, StringValue)
    expect(stored.value).toBe('알 수 없는 \\x 이스케이프')
})

test('Escape sequence: print escaped string', async () => {
    const outputs: string[] = []
    const session = new YaksokSession({
        stdout(output) {
            outputs.push(output)
        },
    })
    await session.addModule('main', `"안녕\\"!" 보여주기`).run()
    expect(outputs).toStrictEqual(['안녕"!'])
})
