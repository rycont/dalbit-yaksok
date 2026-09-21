import { YaksokSession } from '@dalbit-yaksok/core'

const session = new YaksokSession()

await session
    .addModule(
        'main',
        await Deno.readTextFile('./test/codes/function-variants.yak'),
    )
    .run()

// await session
//     .addModule(
//         'main',
//         `
// 약속, 항상 함께하기
//     "우리는 항상 함께야" 반환하기

// 항상 함께하기 보여주기`,
//     )
//     .run()
