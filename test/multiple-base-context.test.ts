import { YaksokSession } from '@dalbit-yaksok/core'
import { expect, test } from 'vite-plus/test'

test('Multiple base contexts should be chained', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    // First base context
    session.useBaseScope(
        await session
            .addModule(
                'base-1',
                `
약속, (A) (B) 더하기
    A + B 반환하기
`.trim(),
            )
            .run(),
    )

    // Second base context (can use first base context)
    session.useBaseScope(
        await session
            .addModule(
                'base-2',
                `
약속, (A) 제곱
    (A) (A) 더하기 반환하기
`.trim(),
            )
            .run(),
    )

    const codeFile = session.addModule(
        'main',
        `
(5 제곱) 보여주기
`.trim(),
    )

    await codeFile.run()

    expect(output).toBe('10\n')
})

test('Multiple base contexts should share variables', async () => {
    let output = ''

    const session = new YaksokSession({
        stdout(message) {
            output += message + '\n'
        },
    })

    session.useBaseScope(await session.addModule('base-1', '값1 = 10').run())
    session.useBaseScope(await session.addModule('base-2', '값2 = 20').run())

    const codeFile = session.addModule('main', '(값1 + 값2) 보여주기')

    await codeFile.run()

    expect(output).toBe('30\n')
})
