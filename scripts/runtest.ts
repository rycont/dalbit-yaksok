import {
    Identifier,
    NotDefinedIdentifierError,
    YaksokSession,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

// await new YaksokSession()
//     .addModule(
//         'main',
//         `약속, 회전설정
//     "rotate" 반환하기

// (회전설정) + 회전설정 * 3 보여주기
// `,
//     )
//     .run()

const r = j.instance(NotDefinedIdentifierError).field({
    resource: j.field({
        name: j.literal('ㅇㅇ'),
    }),
    tokens: j.exist().select('openTokens'),
})

// const t = [
//     { type: 'IDENTIFIER', value: '약속', position: { line: 1, column: 1 } },
//     { type: 'COMMA', value: ',', position: { line: 1, column: 3 } },
//     {
//         type: 'IDENTIFIER',
//         value: '회전설정',
//         position: { line: 1, column: 5 },
//     },
// ]

// const yaksokPattern = j
//     .type<Token[]>()
//     .list([
//         j.field({
//             type: j.literal(TOKEN_TYPE.IDENTIFIER),
//             value: j.literal('약속'),
//         }),
//         j.field({
//             type: j.literal(TOKEN_TYPE.COMMA),
//         }),
//         j.select('firstSignature'),
//         j.space(),
//     ])
//     .compile()

// console.log(yaksokPattern.func(yaksokPattern.id, t))
