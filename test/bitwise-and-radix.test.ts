import { assertEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'
import { NumberValue, StringValue } from '../core/value/primitive.ts'

Deno.test('비트 연산자 파싱 및 실행', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
ㄱ = 3
ㄴ = 6
and결과 = ㄱ & ㄴ
or결과 = ㄱ | ㄴ
xor결과 = ㄱ ^ ㄴ
왼쪽 = ㄱ << 1
오른쪽 = ㄴ >> 1
not결과 = ~ㄱ
`,
    )

    await session.runModule('main')

    const scope = session.getCodeFile('main').ranScope!
    assertEquals((scope.getVariable('and결과') as NumberValue).value, 2)
    assertEquals((scope.getVariable('or결과') as NumberValue).value, 7)
    assertEquals((scope.getVariable('xor결과') as NumberValue).value, 5)
    assertEquals((scope.getVariable('왼쪽') as NumberValue).value, 6)
    assertEquals((scope.getVariable('오른쪽') as NumberValue).value, 3)
    assertEquals((scope.getVariable('not결과') as NumberValue).value, -4)
})

Deno.test('진수 리터럴 및 자리수 변환 파싱', async () => {
    const session = new YaksokSession()
    session.addModule(
        'main',
        `
값 = 십육진수 FF
이진 = 값 의 이진수 값 8자리로
`,
    )

    await session.runModule('main')

    const scope = session.getCodeFile('main').ranScope!
    assertEquals((scope.getVariable('값') as NumberValue).value, 255)
    assertEquals((scope.getVariable('이진') as StringValue).value, '11111111')
})
