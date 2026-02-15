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

    const code1 = `
과일들 = ["바나나", "감", "사과"]
함수 = 람다 가, 나 : (가.길이 - 나.길이)
결과 = 과일들 . 함수 로 정렬하기
결과 보여주기
`
    console.log("--- Test 1: Variable Lambda ---")
    try {
        session.addModule('main1', code1)
        await session.runModule('main1')
    } catch(e) {
        console.error("Crash 1:", e)
    }

    const code2 = `
과일들 = ["바나나", "감", "사과"]
결과 = 과일들 . 람다 가, 나 : (가.길이 - 나.길이) 로 정렬하기
결과 보여주기
`
    console.log("--- Test 2: Inline Lambda ---")
    try {
        session.addModule('main2', code2)
        await session.runModule('main2')
    } catch(e) {
        console.error("Crash 2:", e)
    }
}

runTest()