import { YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'
import { Pyodide } from './pyodide/mod.ts'

async function run(file: string) {
    const session = new YaksokSession({
        stdout: (msg) => console.log(msg),
        stderr: (msg) => console.error(msg)
    })
    await session.extend(new StandardExtension(), {
        baseContextFileName: ['표준'],
    })
    await session.extend(new Pyodide())

    const userCode = await Deno.readTextFile(file)
    session.addModule('main', userCode)
    await session.runModule('main')
}

await run(Deno.args[0])
