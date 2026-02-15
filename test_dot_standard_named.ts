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
약속, (가)와 (나)의 길이 비교
    (가.길이 - 나.길이) 반환하기

과일들 = ["바나나", "감", "사과"]
결과 = 과일들 . (가)와 (나)의 길이 비교 로 정렬하기
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
