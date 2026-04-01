import { assertEquals } from 'https://deno.land/std@0.211.0/assert/mod.ts'
import { YaksokSession, CodeFile, NumberValue } from '../core/mod.ts'

/**
 * baseContext에서 정의된 변수를 같은 이름으로 재대입할 때의 동작을 검증합니다.
 *
 * 검증 항목:
 * - validate() 단계에서 baseContext.ranScope의 변수가 변경되지 않는다.
 * - 재대입은 로컬 스코프에서 발생하며, parent scope는 불변이다.
 * - setBaseContext API 경로, CodeFile 스냅샷 주입 경로 (ADR 0017),
 *   복합 대입 연산자 (+=, -= 등) 모두 올바르게 동작한다.
 */

// ===== 정상 동작 확인 =====

Deno.test('setBaseContext: 다른 변수명으로 읽기 (정상 케이스)', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    await session.setBaseContext('값 = 5')

    session.addModule('main', '결과 = 값 + 10\n결과 보여주기')
    await session.runModule('main')

    assertEquals(output.trim(), '15')
})

Deno.test('setBaseContext: 단순 읽기', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    await session.setBaseContext('값 = 5')

    session.addModule('main', '값 보여주기')
    await session.runModule('main')

    assertEquals(output.trim(), '5')
})

Deno.test('setBaseContext: 새 변수 선언은 로컬 스코프에 생성됨', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    await session.setBaseContext('값 = 5')

    session.addModule('main', '새값 = 100\n새값 보여주기')
    await session.runModule('main')

    assertEquals(output.trim(), '100')

    // 새값은 parent scope에 없어야 함
    const baseContextScope = session.baseContext?.ranScope
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

    await session.setBaseContext('값 = 5')

    session.addModule('main', '값 = 값 + 10\n값 보여주기')
    await session.runModule('main')

    // 값 = 5 + 10 = 15
    assertEquals(output.trim(), '15', 'baseContext의 값(5)에 10을 더해 15가 되어야 함')
})

Deno.test('validation 단계가 baseContext.ranScope의 변수를 변경하지 않음', async () => {
    const session = new YaksokSession({
        stdout() {},
    })

    await session.setBaseContext('값 = 5')

    const baseScopeBefore = session.baseContext?.ranScope
    assertEquals(
        (baseScopeBefore?.variables['값'] as NumberValue)?.value,
        5,
        'validation 전에는 5',
    )

    // validate만 호출 (실행은 하지 않음)
    session.addModule('main', '값 = 값 + 10')
    session.validate('main')

    const baseScopeAfter = session.baseContext?.ranScope
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

    await session.setBaseContext('값 = 5')

    session.addModule('main', '값 = 값 + 10')
    await session.runModule('main')

    // 런타임 재대입은 parent scope chain을 타고 올라가 실제 값을 갱신함 (노트북 시맨틱)
    const baseContextScope = session.baseContext?.ranScope
    assertEquals(
        (baseContextScope?.variables['값'] as NumberValue)?.value,
        15,
        'parent scope의 값이 15로 갱신됨 (런타임 재대입은 parent에 반영)',
    )
})

Deno.test('CodeFile 스냅샷 주입: 같은 변수명으로 재대입하면 15가 됨', async () => {
    let output = ''

    const session1 = new YaksokSession({
        stdout() {},
    })

    const cell1Code = new CodeFile('값 = 5', 'cell1')
    cell1Code.mount(session1)
    session1.files['cell1'] = cell1Code
    await cell1Code.run()

    const session2 = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    cell1Code.mount(session2)
    session2.baseContexts.push(cell1Code)

    session2.addModule('main', '값 = 값 + 10\n값 보여주기')
    await session2.runModule('main')

    // 값 = 5 + 10 = 15
    assertEquals(output.trim(), '15', 'CodeFile 스냅샷 경로에서도 baseContext 값을 올바르게 읽음')
})

Deno.test('CodeFile 스냅샷 주입: 여러 변수 중 일부만 재대입', async () => {
    let output = ''

    const session1 = new YaksokSession({
        stdout() {},
    })

    const cell1Code = new CodeFile('가 = 10\n나 = 20', 'cell1')
    cell1Code.mount(session1)
    session1.files['cell1'] = cell1Code
    await cell1Code.run()

    const session2 = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    cell1Code.mount(session2)
    session2.baseContexts.push(cell1Code)

    session2.addModule('main', '가 = 가 + 5\n(가 + 나) 보여주기')
    await session2.runModule('main')

    // 가 = 10 + 5 = 15, 나 = 20, 결과 = 35
    assertEquals(output.trim(), '35', '재대입한 변수(가=15)와 미변경 변수(나=20)의 합이 35')
})

Deno.test('복합 대입 연산자로 재대입', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    await session.setBaseContext('값 = 5')

    session.addModule('main', '값 += 10\n값 보여주기')
    await session.runModule('main')

    // 5 + 10 = 15
    assertEquals(output.trim(), '15', '복합 대입 연산자도 baseContext 값을 올바르게 읽음')
})
