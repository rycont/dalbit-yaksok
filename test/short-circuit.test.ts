import { YaksokSession } from '../core/mod.ts'
import { assertEquals } from 'assert/equals'
import { assertInstanceOf } from 'assert/instance-of'
import { BooleanValue, NumberValue } from '../core/value/primitive.ts'

async function run(code: string) {
    const session = new YaksokSession()
    session.addModule('main', code)
    await session.runModule('main')
    return session.getCodeFile('main').ranScope!
}

function getBool(scope: ReturnType<typeof run> extends Promise<infer T> ? T : never, name: string): boolean {
    const val = scope.getVariable(name)
    assertInstanceOf(val, BooleanValue)
    return val.value
}

// 이고(And) 단락 평가: 왼쪽이 거짓이면 오른쪽을 평가하지 않음
Deno.test('이고: 왼쪽이 거짓이면 오른쪽 범위 초과 인덱스를 평가하지 않음', async () => {
    const scope = await run(`
목록 = [1, 2, 3]
nx = -1
결과 = 거짓
만약 nx >= 0 이고 목록[nx] == 1 이면
    결과 = 참
`)
    assertEquals(getBool(scope, '결과'), false)
})

// 이고(And) 단락 평가: 왼쪽이 참이면 오른쪽도 평가
Deno.test('이고: 왼쪽이 참이면 오른쪽도 평가', async () => {
    const scope = await run(`
목록 = [1, 2, 3]
nx = 0
결과 = 거짓
만약 nx >= 0 이고 목록[nx] == 1 이면
    결과 = 참
`)
    assertEquals(getBool(scope, '결과'), true)
})

// 이고(And): 여러 조건 체인에서 첫 번째가 거짓이면 나머지 평가 안 함
Deno.test('이고: 세 조건 체인 — 첫 번째 거짓이면 나머지 생략', async () => {
    const scope = await run(`
목록 = [0, 0, 0]
n = -1
결과 = 거짓
만약 n >= 0 이고 n < 3 이고 목록[n] == 0 이면
    결과 = 참
`)
    assertEquals(getBool(scope, '결과'), false)
})

// 이고(And): 체인 중간이 거짓인 경우
Deno.test('이고: 세 조건 체인 — 중간이 거짓이면 마지막 생략', async () => {
    const scope = await run(`
목록 = [0, 0, 0]
n = 5
결과 = 거짓
만약 n >= 0 이고 n < 3 이고 목록[n] == 0 이면
    결과 = 참
`)
    assertEquals(getBool(scope, '결과'), false)
})

// 이고(And): 모두 참인 경우 결과가 참
Deno.test('이고: 모두 참이면 결과 참', async () => {
    const scope = await run(`
목록 = [0, 0, 0]
n = 1
결과 = 거짓
만약 n >= 0 이고 n < 3 이고 목록[n] == 0 이면
    결과 = 참
`)
    assertEquals(getBool(scope, '결과'), true)
})

// 이거나(Or) 단락 평가: 왼쪽이 참이면 오른쪽을 평가하지 않음
Deno.test('이거나: n=10 → n < 0은 거짓, n >= 3은 참 → 결과 참', async () => {
    const scope = await run(`
n = 10
결과 = 거짓
만약 n < 0 이거나 n >= 3 이면
    결과 = 참
`)
    assertEquals(getBool(scope, '결과'), true)
})

// 이거나(Or): 왼쪽이 거짓이면 오른쪽도 평가
Deno.test('이거나: 왼쪽이 거짓이면 오른쪽도 평가', async () => {
    const scope = await run(`
결과 = 거짓 이거나 참
`)
    assertEquals(getBool(scope, '결과'), true)
})

// 이거나(Or): 둘 다 거짓이면 결과 거짓
Deno.test('이거나: 둘 다 거짓이면 결과 거짓', async () => {
    const scope = await run(`
결과 = 거짓 이거나 거짓
`)
    assertEquals(getBool(scope, '결과'), false)
})

// 이거나(Or): 둘 다 참이면 결과 참
Deno.test('이거나: 둘 다 참이면 결과 참', async () => {
    const scope = await run(`
결과 = 참 이거나 참
`)
    assertEquals(getBool(scope, '결과'), true)
})

// 이고와 이거나 혼합
Deno.test('이고와 이거나 혼합: 우선순위 — 이고가 이거나보다 높음', async () => {
    // (거짓 이고 참) 이거나 참  →  거짓 이거나 참  →  참
    const scope = await run(`
결과 = 거짓 이고 참 이거나 참
`)
    assertEquals(getBool(scope, '결과'), true)
})

// 이고와 이거나 혼합: 단락 평가 + 2차원 배열 접근
Deno.test('이고와 이거나 혼합: 단락 평가가 범위 초과를 방지', async () => {
    const scope = await run(`
미로 = [[0, 1], [0, 0]]
nx = -1
ny = 0
결과 = 거짓
만약 nx >= 0 이고 nx < 2 이고 ny >= 0 이고 ny < 2 이고 미로[nx][ny] == 0 이면
    결과 = 참
`)
    assertEquals(getBool(scope, '결과'), false)
})

// 기존 동작 회귀: 단순 산술 연산
Deno.test('기존 동작 회귀: 산술 연산', async () => {
    const scope = await run(`
결과 = 2 + 3 * 4
`)
    const val = scope.getVariable('결과')
    assertInstanceOf(val, NumberValue)
    assertEquals(val.value, 14)
})

// 기존 동작 회귀: 비교 연산
Deno.test('기존 동작 회귀: 비교 연산', async () => {
    const scope = await run(`
결과1 = 3 > 2
결과2 = 1 < 0
결과3 = 5 == 5
결과4 = 5 != 4
`)
    assertEquals(getBool(scope, '결과1'), true)
    assertEquals(getBool(scope, '결과2'), false)
    assertEquals(getBool(scope, '결과3'), true)
    assertEquals(getBool(scope, '결과4'), true)
})
