import { YaksokSession } from '../core/mod.ts'
import { assertEquals } from 'https://deno.land/std@0.211.0/assert/mod.ts'

Deno.test('Multiple base contexts should be chained', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    // First base context
    await session.setBaseContext(`
약속, (A) (B) 더하기
    A + B 반환하기
`.trim())

    // Second base context (can use first base context)
    await session.setBaseContext(`
약속, (A) 제곱
    (A) (A) 더하기 반환하기
`.trim())

    session.addModule('main', `
(5 제곱) 보여주기
`.trim())

    await session.runModule('main')

    assertEquals(output, '10\n')
})

Deno.test('Multiple base contexts should share variables', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    await session.setBaseContext('값1 = 10')
    await session.setBaseContext('값2 = 20')

    session.addModule('main', '(값1 + 값2) 보여주기')

    await session.runModule('main')

    assertEquals(output, '30\n')
})

