import { assertEquals } from 'assert/equals'
import { assertInstanceOf } from 'assert/instance-of'
import { StringValue, YaksokSession } from '../core/mod.ts'

Deno.test('Escape sequence: double quote inside string', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = "안녕\\"!"`).run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '안녕"!')
})

Deno.test('Escape sequence: single quote inside string', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = '작은\\' 따옴표'`)
        .run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, "작은' 따옴표")
})

Deno.test('Escape sequence: backslash', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = "경로\\\\파일"`).run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '경로\\파일')
})

Deno.test('Escape sequence: newline', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "첫줄\\n둘째줄"`)
        .run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '첫줄\n둘째줄')
})

Deno.test('Escape sequence: tab', async () => {
    const session = new YaksokSession()
    const scope = await session.addModule('main', `결과 = "탭\\t문자"`).run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '탭\t문자')
})

Deno.test('Escape sequence: carriage return', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "캐리지\\r리턴"`)
        .run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '캐리지\r리턴')
})

Deno.test('Escape sequence: multiple escapes in one string', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "He said \\"Hello\\", then\\nleft."`)
        .run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, 'He said "Hello", then\nleft.')
})

Deno.test('Escape sequence: unknown escape is preserved', async () => {
    const session = new YaksokSession()
    const scope = await session
        .addModule('main', `결과 = "알 수 없는 \\x 이스케이프"`)
        .run()
    const stored = scope.getVariable('결과')
    assertInstanceOf(stored, StringValue)
    assertEquals(stored.value, '알 수 없는 \\x 이스케이프')
})

Deno.test('Escape sequence: print escaped string', async () => {
    const outputs: string[] = []
    const session = new YaksokSession({
        stdout(output) {
            outputs.push(output)
        },
    })
    await session.addModule('main', `"안녕\\"!" 보여주기`).run()
    assertEquals(outputs, ['안녕"!'])
})
