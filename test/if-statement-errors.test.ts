import { test, expect } from 'vite-plus/test'
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
