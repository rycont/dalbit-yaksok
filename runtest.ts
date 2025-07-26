import { YaksokSession } from '@dalbit-yaksok/core'

const abortController = new AbortController()

const session = new YaksokSession({
    signal: abortController.signal,
})

session.addModule(
    'main',
    `
목록 = 1 ~ 4

목록 의 숫자 마다 반복하기
    숫자 보여주기

목록 의 숫자 마다 반복
    숫자 보여주기

반복 목록 의 숫자 마다
    숫자 보여주기
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
