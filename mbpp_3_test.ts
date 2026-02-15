import { yaksok, YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

async function runTest() {
    const session = new YaksokSession()
    await session.extend(new StandardExtension())
    await session.setBaseContext(session.getCodeFile('표준').text)

    console.log("--- 🧪 MBPP 3번 테스트: 소수 판별 ---")
    
    const code = `
약속, (수) 소수인지 확인
    만약 수 < 2 이면
        "거짓" 반환하기
    
    i = 2
    반복 i * i <= 수 마다
        만약 수 % i == 0 이면
            "거짓" 반환하기
        i = i + 1
    "참" 반환하기

(13 소수인지 확인) 보여주기
`
    session.addModule('main', code)
    await session.runModule('main')
}

runTest()
