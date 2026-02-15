import { YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

async function runTest() {
    const session = new YaksokSession({
        stdout: (msg) => console.log(msg),
        stderr: (msg) => console.error(msg)
    })
    await session.extend(new StandardExtension())
    
    const standardCode = session.getCodeFile('표준').text
    await session.setBaseContext(standardCode)

    console.log("--- 🧪 점 표기 표준 라이브러리 테스트 ---")
    
    const code = `
목록 = [1, 2, 3, 4, 5]
(목록.합계) 보여주기
(목록.길이) 보여주기
(목록.모든곱) 보여주기

날짜 = "2026-02-15"
(날짜."-"로 자르기)[0] 보여주기

# 체이닝 테스트
("A,B,C" . ","로 자르기 . "/"로 합치기) 보여주기
`
    session.addModule('main', code)
    await session.runModule('main')
}

runTest()
