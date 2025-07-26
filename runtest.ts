import { YaksokSession } from '@dalbit-yaksok/core'

const abortController = new AbortController()

const session = new YaksokSession({
    signal: abortController.signal,
})

session.addModule(
    'main',
    `
목록 = [1, 2, 3, 4, 5]
목록[0] += 10
목록[1] -= 2
목록[2] *= 3
목록[3] /= 2
목록[4] %= 3
목록 보여주기
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
