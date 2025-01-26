import { yaksok } from '@dalbit-yaksok/core'

// const quickJS = new QuickJS({
//     prompt,
// })

// await quickJS.init()

await yaksok(
    `
약속, 물어보기
    결과: "성공"

약속, (질문) 물어보기
    결과: "이건 아님"

(물어보기) + 물어보기 * 3 보여주기
("뭐라도" 물어보기) + ("뭐라도" 물어보기) * 3 보여주기
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
