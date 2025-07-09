import { YaksokSession } from '@dalbit-yaksok/core'

const controller = new AbortController()

let output = ''

const session = new YaksokSession({
    flags: {
        'skip-validate-break-or-return-in-loop': true,
    },
    signal: controller.signal,
    stdout: (message: string) => {
        console.log('Output:', message)
        output += message + '\n'

        if (output.length > 50) {
            console.log('Too much output, aborting...')
            controller.abort()
        }
    },
})

session.addModule(
    'main',
    `
반복
    "진짜요?" 보여주기
`,
)

const result = await session.runModule('main')
console.log('Result:', result)
