import { YaksokSession } from '@dalbit-yaksok/core'

const abortController = new AbortController()

const session = new YaksokSession({
    stdout(text) {
        console.log(text)
        if (text === '12') {
            console.log('Killed')
            abortController.abort()
        }
    },
    events: {
        runningCode(start, end, scope, tokens) {
            const code = tokens.map((token) => token.value).join('')
            console.log('Matched code:', code)
        },
    },
    signal: abortController.signal,
    flags: {
        'skip-validate-break-or-return-in-loop': true,
    },
})

session.addModule(
    'main',
    `
내_나이 = 10
내_나이 -= "오류"
`,
    {
        // executionDelay: 500,
    },
)

const startTime = Date.now()

const result = await session.runModule('main')

const endTime = Date.now()
const duration = endTime - startTime
console.log(`Execution finished in ${duration} ms`)
