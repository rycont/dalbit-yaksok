import { yaksok } from '@dalbit-yaksok/core'

// const quickJS = new QuickJS({
//     prompt,
// })

// await quickJS.init()

await yaksok(
    `
결과: "줄
바꿈이
나왔어요"
`,
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
