import { assertEquals } from 'assert'
import { yaksok } from '../core/mod.ts'

Deno.test('Execution Delay in Main Context', async () => {
    const code = {
        main: `
"a" 보여주기
"b" 보여주기
"c" 보여주기
        `,
    }

    let output = ''
    const startTime = Date.now()

    await yaksok(code, {
        executionDelay: 100,
        stdout(text) {
            output += text
        },
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, `abc`)
    assertEquals(300 < duration, true)
    assertEquals(duration < 350, true)
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
    const startTime = Date.now()

    await yaksok(code, {
        executionDelay: 100,
        stdout(text) {
            output += text
        },
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, 'abc')
    assertEquals(300 < duration, true)
    assertEquals(duration < 350, true)
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

    await yaksok(code, {
        executionDelay: 100,
        stdout(text) {
            output += text
        },
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, 'a!bc')
    assertEquals(duration > 200, true)
    assertEquals(duration < 400, true)
})

Deno.test('Execution Delay with Function Call', async () => {
    const code = {
        main: `
약속, 인사
    "안" 보여주기
    "녕" 보여주기

인사
" " 보여주기
인사
        `,
    }

    let output = ''
    const startTime = Date.now()

    await yaksok(code, {
        executionDelay: 100,
        stdout(text) {
            output += text
        },
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    assertEquals(output, '안녕 안녕')
    assertEquals(800 < duration, true)
    assertEquals(duration < 850, true)
})
