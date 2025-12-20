import { assert, assertEquals, assertGreaterOrEqual, assertLess } from '@std/assert'
import { YaksokSession } from '../core/mod.ts'

Deno.test('Execution Delay in Main Context', async () => {
    const code = {
        main: `
"a" 보여주기
"b" 보여주기
"c" 보여주기
        `,
    }

    let output = ''

    const session = new YaksokSession({
        stdout(text) {
            output += text
        },
    })

    const startTime = Date.now()

    session.addModule('main', code.main, {
        executionDelay: 100,
    })
    await session.runModule('main')

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, `abc`)
    assertGreaterOrEqual(duration, 300)
    assertLess(duration, 450)
})

Deno.test('Execution Delay with Imported File', async () => {
    const code = {
        main: `
"a" 보여주기
@imported "b" 라고 말하기
"c" 보여주기
        `,
        imported: `
약속, (text) 라고 말하기
    text 보여주기
        `,
    }

    let output = ''

    const session = new YaksokSession({
        stdout(text) {
            output += text
        },
    })

    const startTime = Date.now()

    session.addModule('main', code.main, {
        executionDelay: 100,
    })
    session.addModule('imported', code.imported)

    await session.runModule('main')

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, 'abc')
    assertGreaterOrEqual(duration, 300)
    assertLess(duration, 450)
})

Deno.test('Execution Delay with Nested Import', async () => {
    const code = {
        main: `
"a" 보여주기
@imported "b" 출력하기
"c" 보여주기
        `,
        imported: `
@nested "!"라고 말하기
약속, (text) 출력하기
    text 보여주기
        `,
        nested: `
약속, (text)라고 말하기
    text 보여주기
        `,
    }

    let output = ''

    const startTime = Date.now()

    const session = new YaksokSession({
        stdout(text) {
            output += text
        },
    })

    session.addModule('main', code.main, {
        executionDelay: 100,
    })
    session.addModule('imported', code.imported)
    session.addModule('nested', code.nested)

    const result = await session.runModule('main')

    const endTime = Date.now()

    assert(
        result.reason === 'finish',
        `Expected finish, but got ${result.reason}`,
    )

    const duration = endTime - startTime

    assertEquals(output, 'a!bc')

    assertGreaterOrEqual(duration, 300)
    assertLess(duration, 350)
})

Deno.test('Execution Delay with Function Call', async () => {
    let output = ''
    const startTime = Date.now()

    const session = new YaksokSession({
        stdout(text) {
            output += text
        },
    })

    session.addModule(
        'main',
        `
약속, 인사
    "안" 보여주기
    "녕" 보여주기

인사
" " 보여주기
인사
        `,
        {
            executionDelay: 100,
        },
    )

    const result = await session.runModule('main')
    assert(
        result.reason === 'finish',
        `Expected finish, but got ${result.reason}`,
    )
    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, '안녕 안녕')
    assertGreaterOrEqual(duration, 800)
    assertLess(duration, 850)
})

Deno.test('Execution Delay with Base Context', async () => {
    const expectedOutputs = ['그래요', '그렇군요']

    let lastInstructionTime = new Date().getTime()

    const session = new YaksokSession({
        stdout(text) {
            assertEquals(text, expectedOutputs.shift())
            const currentTime = new Date().getTime()
            const timeDiff = currentTime - lastInstructionTime
            assertGreaterOrEqual(timeDiff, 100)
            assertLess(timeDiff, 150)
            lastInstructionTime = currentTime
        },
    })

    const baseContextStartTime = Date.now()
    await session.setBaseContext(`
내_이름 = "달빛"
내_나이 = 3        
`)
    const baseContextEndTime = Date.now()
    const baseContextDuration = baseContextEndTime - baseContextStartTime

    assertGreaterOrEqual(baseContextDuration, 0)
    assertLess(baseContextDuration, 50)

    const mainContextStartTime = Date.now()

    session.addModule(
        'main',
        `
"그래요" 보여주기
"그렇군요" 보여주기
`,
        {
            executionDelay: 100,
        },
    )

    await session.runModule('main')

    const mainContextEndTime = Date.now()
    const mainContextDuration = mainContextEndTime - mainContextStartTime

    assertGreaterOrEqual(mainContextDuration, 200)
    assertLess(mainContextDuration, 250)
})

Deno.test('Execution Delay in Formula', async () => {
    const expectedRunningTokens = [
        `"1 + 2 = " + ( 1 + 2 ) 보여주기`,
        `"1 + 2 = "`,
        `( 1 + 2 )`,
        `1`,
        `2`,
        `1 + 2`,
        `"1 + 2 = " + ( 1 + 2 )`,
        `"1 - 2 = " + ( 1 - 2 ) 보여주기`,
        `"1 - 2 = "`,
        `( 1 - 2 )`,
        `1`,
        `2`,
        `1 - 2`,
        `"1 - 2 = " + ( 1 - 2 )`,
        `"1 * 2 = " + ( 1 * 2 ) 보여주기`,
        `"1 * 2 = "`,
        `( 1 * 2 )`,
        `1`,
        `2`,
        `1 * 2`,
        `"1 * 2 = " + ( 1 * 2 )`,
        `"1 / 2 = " + ( 1 / 2 ) 보여주기`,
        `"1 / 2 = "`,
        `( 1 / 2 )`,
        `1`,
        `2`,
        `1 / 2`,
        `"1 / 2 = " + ( 1 / 2 )`,
    ]

    let lastRun = new Date().getTime()

    const session = new YaksokSession({
        events: {
            runningCode(_start, _end, _scope, tokens) {
                const runningCodeText = tokens
                    .map((token) => token.value)
                    .join(' ')
                assertEquals(runningCodeText, expectedRunningTokens.shift())
                const currentTime = new Date().getTime()
                const timeDiff = currentTime - lastRun
                assertGreaterOrEqual(timeDiff, 100)
                assertLess(timeDiff, 150)
                lastRun = currentTime
            },
        },
    })

    session.addModule(
        'main',
        `
"1 + 2 = " + (1 + 2) 보여주기
"1 - 2 = " + (1 - 2) 보여주기
"1 * 2 = " + (1 * 2) 보여주기
"1 / 2 = " + (1 / 2) 보여주기
`,
        {
            executionDelay: 100,
        },
    )

    const startTime = Date.now()
    const result = await session.runModule('main')
    const endTime = Date.now()

    assert(
        result.reason === 'finish',
        `Expected finish, but got ${result.reason}`,
    )

    const duration = endTime - startTime

    assertGreaterOrEqual(duration, 2800)
    assertLess(duration, 2900)
})

Deno.test('Execution Delay with 0ms', async () => {
    const code = {
        main: `
"a" 보여주기
"b" 보여주기
"c" 보여주기
        `,
    }

    let output = ''

    const session = new YaksokSession({
        stdout(text) {
            output += text
        },
    })

    const startTime = Date.now()

    session.addModule('main', code.main, {
        executionDelay: 0,
    })
    await session.runModule('main')

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, `abc`)
    assertGreaterOrEqual(duration, 0)
    assertLess(duration, 50)
})

Deno.test('Execution Delay with no delay set', async () => {
    const code = {
        main: `
"a" 보여주기
"b" 보여주기
"c" 보여주기
        `,
    }

    let output = ''

    const session = new YaksokSession({
        stdout(text) {
            output += text
        },
    })

    const startTime = Date.now()

    session.addModule('main', code.main) // No executionDelay config
    await session.runModule('main')

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, `abc`)
    assertGreaterOrEqual(duration, 0)
    assertLess(duration, 50)
})
