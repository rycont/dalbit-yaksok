import { assertEquals } from 'https://deno.land/std@0.211.0/assert/mod.ts'
import { YaksokSession, NumberValue } from '../core/mod.ts'

Deno.test('setBaseContext: 다른 변수명으로 읽기 (정상 케이스)', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const codeFile = session.addModule('main', '결과 = 값 + 10\n결과 보여주기')
    await codeFile.run()

    assertEquals(output.trim(), '15')
})

Deno.test('setBaseContext: 단순 읽기', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const codeFile = session.addModule('main', '값 보여주기')
    await codeFile.run()

    assertEquals(output.trim(), '5')
})

Deno.test('setBaseContext: 새 변수 선언은 로컬 스코프에 생성됨', async () => {
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

    assertEquals(output.trim(), '100')

    assertEquals(baseContextScope?.variables['새값'], undefined)
})

// ===== 재대입 동작 검증 =====

Deno.test('setBaseContext: 같은 변수명으로 재대입하면 값 + 10 = 15가 됨', async () => {
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
    assertEquals(
        output.trim(),
        '15',
        'baseContext의 값(5)에 10을 더해 15가 되어야 함',
    )
})

Deno.test('validation 단계가 baseContext.ranScope의 변수를 변경하지 않음', async () => {
    const session = new YaksokSession({
        stdout() {},
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const baseScopeBefore = session.baseScope
    assertEquals(
        (baseScopeBefore?.variables['값'] as NumberValue)?.value,
        5,
        'validation 전에는 5',
    )

    // validate만 호출 (실행은 하지 않음)
    session.addModule('main', '값 = 값 + 10')

    const baseScopeAfter = session.baseScope
    assertEquals(
        (baseScopeAfter?.variables['값'] as NumberValue)?.value,
        5,
        'validate() 후에도 baseContext.ranScope의 값이 5로 유지됨',
    )
})

Deno.test('재대입 후 parent scope에 반영됨', async () => {
    const session = new YaksokSession({
        stdout() {},
    })

    session.useBaseScope(await session.addModule('base', '값 = 5').run())

    const codeFile = session.addModule('main', '값 = 값 + 10')
    await codeFile.run()

    // 런타임 재대입은 parent scope chain을 타고 올라가 실제 값을 갱신함 (노트북 시맨틱)
    const baseContextScope = session.baseScope
    assertEquals(
        (baseContextScope?.variables['값'] as NumberValue)?.value,
        15,
        'parent scope의 값이 15로 갱신됨 (런타임 재대입은 parent에 반영)',
    )
})

Deno.test('복합 대입 연산자로 재대입', async () => {
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
    assertEquals(
        output.trim(),
        '15',
        '복합 대입 연산자도 baseContext 값을 올바르게 읽음',
    )
})
