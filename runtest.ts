import { yaksok } from '@dalbit-yaksok/core'

// const quickJS = new QuickJS({
//     prompt,
// })

// await quickJS.init()

await yaksok(
    `
"Hello, world!" 보여주기
"안녕, 세계!" 보여주기
"안녕하세요, 세계!" 보여주기

반복 1~10의 숫자 마다
    숫자 보여주기
`,
    {
        executionDelay: 500,
        events: {
            runningCode(start, end) {
                console.log(
                    '| runningCode > ',
                    `${start.line}:${start.column} ~ ${end.line}:${end.column}`,
                )
            },
        },
        stdout(message) {
            console.log('| stdout > ', message)
        },
    },
    // {
    //     runFFI(runtime, bodyCode, args) {
    //         if (runtime === 'JavaScript') {
    //             const result = quickJS.run(bodyCode, args)
    //             if (!result) {
    //                 throw new Error('Result is null')
    //             }

    //             return result
    //         }

    //         throw new Error(`Unknown runtime: ${runtime}`)
    //     },
    // },
)
