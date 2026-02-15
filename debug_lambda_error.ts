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
과일들 = ["바나나", "감", "사과"]
결과 = 과일들 . (람다 가, 나 : (가.길이 - 나.길이)) 로 정렬하기
결과 보여주기
`
    session.addModule('main', code)
    await session.runModule('main')
}

runTest()
