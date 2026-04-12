import { assert } from '@std/assert'
import { YaksokSession } from '../../core/mod.ts'

async function runCode(code: string) {
    const session = new YaksokSession()
    session.addModule('main', code)
    const results = await session.runModule('main')
    return results.get('main')!
}

function getMessages(result: Awaited<ReturnType<typeof runCode>>) {
    assert(
        result.reason === 'validation',
        `Expected validation error, got ${result.reason}`,
    )
    return [...result.errors.values()].flat().map((e) => e.message)
}

Deno.test('이고 붙여쓰기 - 일반 표현식에서 hint 포함', async () => {
    // 반복문/조건문 바깥에서 이고가 붙어있을 때 NotDefinedIdentifierError에 hint가 붙어야 함
    const result = await runCode(`결과이고 보여주기`)
    const messages = getMessages(result)
    assert(
        messages.some((m) => m.includes('띄어써야 해요')),
        `Expected '띄어써야 해요' hint, got: ${messages.join(' | ')}`,
    )
    assert(
        messages.some((m) => m.includes('"결과"')),
        `Expected base name "결과" in hint, got: ${messages.join(' | ')}`,
    )
    assert(
        messages.some((m) => m.includes('"이고"')),
        `Expected suffix "이고" in hint, got: ${messages.join(' | ')}`,
    )
})

Deno.test('이고 붙여쓰기 - 반복 동안 조건에서 hint 포함', async () => {
    // 반복 동안 루프 조건에 이고가 붙어있을 때 반복문 에러 메시지에 hint가 붙어야 함
    const result = await runCode(`
i = 0
반복 i < 왼쪽길이이고 i < 3 동안
    i = i + 1
    반복 그만
`)
    const messages = getMessages(result)
    assert(
        messages.some((m) => m.includes('반복문')),
        `Expected '반복문' error, got: ${messages.join(' | ')}`,
    )
    assert(
        messages.some((m) => m.includes('띄어써야 해요')),
        `Expected '띄어써야 해요' hint in loop error, got: ${messages.join(' | ')}`,
    )
})

Deno.test('이고 붙여쓰기 - 반복 마다 이터레이션 대상에서 hint 포함', async () => {
    // 반복 마다 루프의 이터레이션 대상 표현식에 이고가 붙어있을 때 hint가 포함되어야 함
    // 이 경우는 NotDefinedIdentifierError(variable.ts)에서 처리됨
    const result = await runCode(`
반복 목록이고 의 항목 마다
    항목 보여주기
`)
    const messages = getMessages(result)
    assert(
        messages.some((m) => m.includes('띄어써야 해요')),
        `Expected '띄어써야 해요' hint, got: ${messages.join(' | ')}`,
    )
    assert(
        messages.some((m) => m.includes('"목록"')),
        `Expected base name "목록" in hint, got: ${messages.join(' | ')}`,
    )
})
