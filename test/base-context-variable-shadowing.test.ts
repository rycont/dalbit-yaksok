import { YaksokSession, NumberValue } from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('setBaseContext: 다른 변수명으로 읽기 (정상 케이스)', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const codeFile = session.addModule('main', '결과 = 값 + 10\n결과 보여주기')
    await codeFile.run()

    expect(output.trim()).toBe('15')
})

test('setBaseContext: 단순 읽기', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const codeFile = session.addModule('main', '값 보여주기')
    await codeFile.run()

    expect(output.trim()).toBe('5')
})

test('setBaseContext: 새 변수 선언은 로컬 스코프에 생성됨', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    const baseContextScope = await session.addModule('base', '값 = 5').run()
    session.useBaseScope(baseContextScope)

    const codeFile = session.addModule('main', '새값 = 100\n새값 보여주기')
    await codeFile.run()

    expect(output.trim()).toBe('100')

    expect(baseContextScope?.variables['새값']).toBe(undefined)
})

// ===== 재대입 동작 검증 =====

test('setBaseContext: 같은 변수명으로 재대입하면 값 + 10 = 15가 됨', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const codeFile = session.addModule('main', '값 = 값 + 10\n값 보여주기')
    await codeFile.run()

    // 값 = 5 + 10 = 15
    expect(output.trim()).toBe('15')
})

test('validation 단계가 baseContext.ranScope의 변수를 변경하지 않음', async () => {
    const session = new YaksokSession({
        stdout() {},
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const baseScopeBefore = session.baseScope
    expect((baseScopeBefore?.variables['값'] as NumberValue)?.value).toBe(5)

    // validate만 호출 (실행은 하지 않음)
    session.addModule('main', '값 = 값 + 10')

    const baseScopeAfter = session.baseScope
    expect((baseScopeAfter?.variables['값'] as NumberValue)?.value).toBe(5)
})

test('재대입 후 parent scope에 반영됨', async () => {
    const session = new YaksokSession({
        stdout() {},
    })

    const baseScope = await session.addModule('base', '값 = 5').run()
    session.useBaseScope(baseScope)

    const codeFile = session.addModule('main', '값 = 값 + 10')
    const childScope = await codeFile.run()

    expect((baseScope.variables['값'] as NumberValue).value).toBe(5)
    expect((childScope.variables['값'] as NumberValue).value).toBe(15)
})

test('복합 대입 연산자로 재대입', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const codeFile = session.addModule('main', '값 += 10\n값 보여주기')
    await codeFile.run()

    // 5 + 10 = 15
    expect(output.trim()).toBe('15')
})
