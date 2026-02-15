import { yaksok, YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

async function runTest() {
    const session = new YaksokSession()
    await session.extend(new StandardExtension())

    console.log("--- 🧪 표준 라이브러리 테스트 (BaseContext 설정) ---")
    
    const code = `
약속, (단어목록)에서 최대 길이 구하기
    최대 = 0
    반복 단어목록 의 단어 마다
        만약 (단어 의 길이) > 최대 이면
            최대 = (단어 의 길이)
    최대 반환하기

(["사과", "바나나", "포도"]에서 최대 길이 구하기) 보여주기
`
    // 표준 모듈의 약속들을 현재 세션의 기본 컨텍스트로 주입
    await session.setBaseContext(session.getCodeFile('표준').text)

    session.addModule('main', code)
    const result = await session.runModule('main')
}

runTest()
