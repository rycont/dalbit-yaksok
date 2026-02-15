import { YaksokSession } from '../core/mod.ts'
import { assertEquals } from 'assert/equals'
import { StringValue } from '../core/value/primitive.ts'

Deno.test('Single variable interpolation', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
이름 = "홍길동"
결과 = "안녕, {이름}!"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '안녕, 홍길동!')
})

Deno.test('Multiple variables interpolation', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
이름 = "철수"
나이 = 25
결과 = "{이름}님은 {나이}살입니다"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '철수님은 25살입니다')
})

Deno.test('Arithmetic expression interpolation', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
값 = 10
결과 = "결과는 {값 * 2}입니다"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '결과는 20입니다')
})

Deno.test('Complex arithmetic expression', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
a = 5
b = 3
결과 = "합: {a + b}, 곱: {a * b}"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '합: 8, 곱: 15')
})

Deno.test('Parenthesized expression', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
a = 2
b = 3
결과 = "{(a + b) * 2}"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '10')
})

Deno.test('String concatenation in template', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
성 = "김"
이름 = "철수"
결과 = "이름: {성 + 이름}"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '이름: 김철수')
})

Deno.test('Single quote template', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
이름 = "홍길동"
결과 = '안녕, {이름}!'
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '안녕, 홍길동!')
})

Deno.test('Template with print statement', async () => {
    const printed: string[] = []
    const session = new YaksokSession({
        stdout(value) {
            printed.push(value)
        },
    })
    session.addModule(
        'main',
        `
이름 = "세계"
"안녕, {이름}!" 보여주기
`,
    )
    await session.runModule('main')
    assertEquals(printed, ['안녕, 세계!'])
})

Deno.test('Only interpolation (no static parts)', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
값 = 42
결과 = "{값}"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '42')
})

Deno.test('No interpolation (plain string)', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
결과 = "일반 문자열"
`,
    )
    await session.runModule('main')
    const result = session
        .getCodeFile('main')
        .ranScope?.getVariable('결과') as StringValue
    assertEquals(result.value, '일반 문자열')
})

Deno.test(
    'Nested braces should work as plain text outside interpolation',
    async () => {
        const session = new YaksokSession()
        session.addModule(
            'main',
            `
값 = 10
결과 = "값: {값}"
`,
        )
        await session.runModule('main')
        const result = session
            .getCodeFile('main')
            .ranScope?.getVariable('결과') as StringValue
        assertEquals(result.value, '값: 10')
    },
)
