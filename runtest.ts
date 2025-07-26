import { YaksokSession } from '@dalbit-yaksok/core'

const abortController = new AbortController()

const session = new YaksokSession({
    signal: abortController.signal,
})

session.addModule(
    'main',
    `
27번 반복
    "대한민국 만세!" 보여주기
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
