import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession({
    events: {
        runningCode: (start, end, scope, tokens) => {
            console.log(tokens.map((token) => token.value).join(' '))
        },
    },
    stdout(text) {
        // console.log(text)
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
        executionDelay: 0, // No delay for testing
    },
)

const startTime = Date.now()

const result = await session.runModule('main')

const endTime = Date.now()
const duration = endTime - startTime
console.log(`Execution finished in ${duration} ms`)
