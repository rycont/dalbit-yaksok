import { YaksokSession } from './core/mod.ts'

async function test(label: string, code: string) {
    console.log(`\n=== ${label} ===`)
    const session = new YaksokSession({ stdout: () => {} })
    session.addModule('main', code)
    await session.runModule('main')
}

await test('배열 길이 <= 1', `배열 = [1]\n만약 배열 길이 <= 1 이면\n    "작다" 보여주기`)
await test('1 <= 배열 길이', `배열 = [1]\n만약 1 <= 배열 길이 이면\n    "작다" 보여주기`)
