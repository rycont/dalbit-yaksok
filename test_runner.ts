import { YaksokSession } from './core/mod.ts'
import { StandardExtension } from './standard/mod.ts'

const code = await Deno.readTextFile('test_sort_custom.yak')
const session = new YaksokSession()

// Note: StandardExtension registers '표준' module.
// We need to add it to base context so its definitions are available globally.
await session.extend(new StandardExtension(), { baseContextFileName: ['표준'] })

session.addModule('main', code)
await session.runModule('main')
