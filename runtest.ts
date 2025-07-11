import { NumberValue, YaksokSession } from '@dalbit-yaksok/core'

const controller = new AbortController()

const session = new YaksokSession({
    signal: controller.signal,
    flags: {
        'skip-validate-break-or-return-in-loop': true,
    },
})

await session.extend({
    manifest: {
        ffiRunner: {
            runtimeName: 'Runtime',
        },
    },
    async executeFFI(_code, args) {
        const waitingTime = (args.숫자 as NumberValue).value * 1000

        await new Promise((resolve) => setTimeout(resolve, waitingTime))
        return new NumberValue(0)
    },
})

session.addModule(
    'main',
    `
번역(Runtime), (숫자)초 기다리기
***
    wait
***

반복
    "진짜요?" 보여주기
    1초 기다리기
`,
)

setTimeout(() => {
    controller.abort()
}, 3000)

session.runModule('main').then(console.log)
