import { YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

async function run(file: string) {
    const session = new YaksokSession({
        stdout: (msg) => console.log(msg),
        stderr: (msg) => console.error(msg)
    })
    await session.extend(new StandardExtension())
    
    // 표준 라이브러리 약속을 전역으로 주입하기 위해 setBaseContext를 사용합니다.
    const standardCode = session.getCodeFile('표준').text
    await session.setBaseContext(standardCode)

    const userCode = await Deno.readTextFile(file)
    session.addModule('main', userCode)
    await session.runModule('main')
}

await run(Deno.args[0])
