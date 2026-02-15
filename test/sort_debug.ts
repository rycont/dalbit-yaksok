import { YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

async function runTest() {
    const session = new YaksokSession({
        stdout: (msg) => console.log("STDOUT:", msg),
        stderr: (msg) => console.error("STDERR:", msg)
    })
    await session.extend(new StandardExtension())
    
    const standardCode = session.getCodeFile('표준').text
    await session.setBaseContext(standardCode)

    const code = `
목록 = [3, 1, 2]
결과 = 목록.정렬하기
결과 보여주기
`
    try {
        session.addModule('main', code)
        await session.runModule('main')
    } catch(e) {
        console.error("Crash:", e)
    }
}

runTest()
