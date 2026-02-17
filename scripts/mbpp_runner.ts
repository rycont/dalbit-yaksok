import { YaksokSession } from '../core/mod.ts'
import { StandardExtension } from '../exts/standard/mod.ts'
import { Pyodide } from '../exts/pyodide/mod.ts'

async function run(file: string) {
    const session = new YaksokSession({
        stdout: (msg) => console.log(msg),
        stderr: (msg) => console.error(msg)
    })
    const standard = new StandardExtension();
    await session.extend(standard, {
        baseContextFileName: ['표준'],
    })
    await session.setBaseContext(standard.manifest.module!['표준']);
    await session.extend(new Pyodide())

    const userCode = await Deno.readTextFile(file)
    session.addModule('main', userCode)
    await session.runModule('main')
}

await run(Deno.args[0])
