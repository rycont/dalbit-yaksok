import { assert, assertEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'

async function runCode(code: string) {
    let printed = ''
    const session = new YaksokSession({
        stdout: (msg: string) => (printed += msg + '\n'),
    })
    session.addModule('main', code)
    const results = await session.runModule('main')
    return { result: results.get('main')!, printed }
}

Deno.test('만약 - 정상 동작', async () => {
    const { result, printed } = await runCode(`만약 참 이면\n    "실행됨" 보여주기`)
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)
    assertEquals(printed, '실행됨\n')
})

Deno.test('만약 - 정상 동작 (아니면 포함)', async () => {
    const { result, printed } = await runCode(
        `만약 거짓 이면\n    "if" 보여주기\n아니면\n    "else" 보여주기`,
    )
    assert(result.reason === 'finish', `Expected finish, got ${result.reason}`)
    assertEquals(printed, 'else\n')
})

Deno.test('만약 - 본문 없음 오류', async () => {
    const { result } = await runCode(`만약 참 이면\n"다음줄" 보여주기`)
    assert(
        result.reason === 'validation',
        `Expected validation error, got ${result.reason}`,
    )
    const messages = [...result.errors.values()].flat().map((e) => e.message)
    assert(
        messages.some((m) => m.includes('본문이 없어요')),
        `Expected '본문이 없어요' error, got: ${messages.join(', ')}`,
    )
})

Deno.test('만약 - 조건 없음 오류', async () => {
    const { result } = await runCode(`만약 이면\n    "body" 보여주기`)
    assert(
        result.reason === 'validation',
        `Expected validation error, got ${result.reason}`,
    )
    const messages = [...result.errors.values()].flat().map((e) => e.message)
    assert(
        messages.some((m) => m.includes('실행 조건이 올바르지 않아요')),
        `Expected '실행 조건이 올바르지 않아요' error, got: ${messages.join(', ')}`,
    )
})

Deno.test('만약 - 조건 파싱 오류', async () => {
    const { result } = await runCode(`만약 이상한거 모름 이면\n    "body" 보여주기`)
    assert(
        result.reason === 'validation',
        `Expected validation error, got ${result.reason}`,
    )
    const messages = [...result.errors.values()].flat().map((e) => e.message)
    assert(
        messages.some((m) => m.includes('부분을 이해할 수 없어요')),
        `Expected '부분을 이해할 수 없어요' error, got: ${messages.join(', ')}`,
    )
})

Deno.test('아니면 - 단독 사용 오류', async () => {
    const { result } = await runCode(`아니면\n    "body" 보여주기`)
    assert(
        result.reason === 'validation',
        `Expected validation error, got ${result.reason}`,
    )
    const messages = [...result.errors.values()].flat().map((e) => e.message)
    assert(
        messages.some((m) => m.includes('"아니면"은 "만약"')),
        `Expected standalone 아니면 error, got: ${messages.join(', ')}`,
    )
})
