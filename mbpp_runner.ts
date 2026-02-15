import { yaksok } from './core/mod.ts'

const code = await Deno.readTextFile(Deno.args[0])

try {
    await yaksok(code)
} catch (e) {
    console.log("--- ERROR ---")
    if (e.message) console.log(e.message)
    if (e.position) console.log(`위치: ${e.position}`)
}
