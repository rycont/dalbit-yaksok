import { test, expect, assert } from 'vite-plus/test'
import {
    CannotParseError,
    MissingEvaluable,
    MissingStatementBody,
    UnexpectedTokenError,
    YaksokSession,
} from '../core/mod.ts'

async function runCode(code: string) {
    let printed = ''

    let getPrinted = () => printed

    const session = new YaksokSession({
        stdout: (msg: string) => (printed += msg + '\n'),
    })

    const codeFile = session.addModule('main', code)

    return { codeFile, getPrinted }
}

test('만약 - 정상 동작', async () => {
    const { codeFile, getPrinted } = await runCode(
        `만약 참 이면\n    "실행됨" 보여주기`,
    )

    await codeFile.run()
    expect(getPrinted()).toBe('실행됨\n')
})

test('만약 - 정상 동작 (아니면 포함)', async () => {
    const { codeFile, getPrinted } = await runCode(
        `만약 거짓 이면\n    "if" 보여주기\n아니면\n    "else" 보여주기`,
    )

    await codeFile.run()
    expect(getPrinted()).toBe('else\n')
})

test('만약 - 본문 없음 오류', async () => {
    const { codeFile } = await runCode(`만약 참 이면\n"다음줄" 보여주기`)

    assert(codeFile.prepareErrors[0] instanceof MissingStatementBody)
})

test('만약 - 조건 없음 오류', async () => {
    const { codeFile } = await runCode(`만약 이면\n    "body" 보여주기`)
    assert(codeFile.prepareErrors[0] instanceof MissingEvaluable)
})

test('만약 - 조건 파싱 오류', async () => {
    const { codeFile } = await runCode(
        `만약 이상한거 모름 이면\n    "body" 보여주기`,
    )

    assert(codeFile.prepareErrors[0] instanceof CannotParseError)
})

test('아니면 - 단독 사용 오류', async () => {
    const {
        codeFile: {
            prepareErrors: [e],
        },
    } = await runCode(`아니면\n    "body" 보여주기`)

    assert(
        e instanceof UnexpectedTokenError && e.resource.parts === '조건문 시작',
    )
})
