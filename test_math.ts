import { YaksokSession } from './core/mod.ts'
import { MathExtension } from './math/mod.ts'

const session = new YaksokSession({
    stdout: (msg) => console.log(msg),
    stderr: (msg) => console.error(msg)
})
try {
    await session.extend(new MathExtension())
    const mathCode = session.getCodeFile('수학').text
    console.log("Setting Base Context...")
    const result = await session.setBaseContext(mathCode)
    console.log("Base Context Result:", result.reason)

    session.addModule('main', '보여주기 (10의 제곱)')
    await session.runModule('main')
} catch (e) {
    console.error("CATCHED:", e)
}
