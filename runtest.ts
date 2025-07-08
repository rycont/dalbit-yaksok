import { yaksok } from '@dalbit-yaksok/core'
import { QuickJS } from '@dalbit-yaksok/quickjs'

const quickjs = new QuickJS({
    prompt,
})

await quickjs.init()
await yaksok(
    `
순서 = 0
반복
    순서 = 순서 + 1
    만약 순서 == 3 이면
        [] / 2 보여주기`,
    {
        flags: {
            'skip-validate-break-or-return-in-loop': true,
        },
    },
)
