import { yaksok, YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

async function runTest() {
    const session = new YaksokSession()
    await session.extend(new StandardExtension())
    await session.setBaseContext(session.getCodeFile('표준').text)

    console.log("--- 🧪 MBPP 3번 테스트: 소수 판별 (무한루프 형식) ---")
    
    const code = await Deno.readTextFile('mbpp_3_fix.yak')
    session.addModule('main', code)
    await session.runModule('main')
}

runTest()
