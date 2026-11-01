import { Token, TOKEN_TYPE, YaksokSession } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
//
// await new YaksokSession().addModule(
//     'main',
//     `약속, 이동하기(가로, 세로)
//     "{가로},{세로}" 보여주기
//
// 이동하기(1, 2)`,
// )
// // .run()

const yaksokPattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('약속'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.select('firstSignature'),
        j.space(),
    ])
    .compile()

console.log(
    yaksokPattern.func(yaksokPattern.id, [
        {
            type: 'IDENTIFIER',
            value: '약속',
            position: { line: 1, column: 1 },
        },
        { type: 'COMMA', value: ',', position: { line: 1, column: 3 } },
        {
            type: 'IDENTIFIER',
            value: '이동하기',
            position: { line: 1, column: 5 },
        },
        {
            type: 'OPENING_PARENTHESIS',
            value: '(',
            position: { line: 1, column: 9 },
        },
        {
            type: 'IDENTIFIER',
            value: '가로',
            position: { line: 1, column: 10 },
        },
        { type: 'COMMA', value: ',', position: { line: 1, column: 12 } },
        {
            type: 'IDENTIFIER',
            value: '세로',
            position: { line: 1, column: 14 },
        },
        {
            type: 'CLOSING_PARENTHESIS',
            value: ')',
            position: { line: 1, column: 16 },
        },
    ]),
)
