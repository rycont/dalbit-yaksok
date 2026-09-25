import { assert, assertEquals } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'

async function runCode(code: string) {
    let printed = ''

    let getPrinted = () => printed

    const session = new YaksokSession({
        stdout: (msg: string) => (printed += msg + '\n'),
    })

    const codeFile = session.addModule('main', code)

    return { codeFile, getPrinted }
}

Deno.test('만약 - 정상 동작', async () => {
    const { codeFile, getPrinted } = await runCode(
        `만약 참 이면\n    "실행됨" 보여주기`,
    )

    await codeFile.run()
    assertEquals(getPrinted(), '실행됨\n')
})

Deno.test('만약 - 정상 동작 (아니면 포함)', async () => {
    const { codeFile, getPrinted } = await runCode(
        `만약 거짓 이면\n    "if" 보여주기\n아니면\n    "else" 보여주기`,
    )

    await codeFile.run()
    assertEquals(getPrinted(), 'else\n')
})

Deno.test('만약 - 본문 없음 오류', async () => {
    const { codeFile } = await runCode(`만약 참 이면\n"다음줄" 보여주기`)
    const messages = codeFile.prepareErrors.map((e) => e.message)
    assert(
        messages.some((m) =>
            m.includes('다음 줄에 네 칸을 띄고 실행할 코드를 작성 해주세요.'),
        ),
        `Expected '다음 줄에 네 칸을 띄고 실행할 코드를 작성 해주세요.' error, got: ${messages.join(', ')}`,
    )
})

Deno.test('만약 - 조건 없음 오류', async () => {
    const { codeFile } = await runCode(`만약 이면\n    "body" 보여주기`)
    const messages = codeFile.prepareErrors.map((e) => e.message)
    assert(
        messages.some((m) =>
            m.includes('다음 줄에 적은 코드를 언제 실행할 지'),
        ),
        `Expected '다음 줄에 적은 코드를 언제 실행할 지' error, got: ${messages.join(', ')}`,
    )
})

Deno.test('만약 - 조건 파싱 오류', async () => {
    const { codeFile } = await runCode(
        `만약 이상한거 모름 이면\n    "body" 보여주기`,
    )
    const messages = codeFile.prepareErrors.map((e) => e.message)
    assert(
        messages.some((m) => m.includes('부분을 실행할 수 없어요')),
        `Expected '부분을 실행할 수 없어요' error, got: ${messages.join(', ')}`,
    )
})

Deno.test('아니면 - 단독 사용 오류', async () => {
    const { codeFile } = await runCode(`아니면\n    "body" 보여주기`)
    const messages = codeFile.prepareErrors.map((e) => e.message)
    assert(
        messages.some((m) => m.includes('"아니면"은 "만약"')),
        `Expected standalone 아니면 error, got: ${messages.join(', ')}`,
    )
})
