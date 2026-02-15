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
목록 = [1, 2, 3]
목록 . 람다 가:가 + 1 로 변환하기
`
    session.addModule('main', code)
    await session.runModule('main')
}

runTest()
