import { yaksok, RuntimeConfig } from '@dalbit-yaksok/core'

const runtimeConfig: Partial<RuntimeConfig> = {
    executionDelay: 500,
    events: {
        runningCode: (start, end) => {
            console.log('start:', start, 'end:', end)
        },
    },
}

await yaksok(
    `
1 보여주기
1 + 2 보여주기
`,
    runtimeConfig,
)
