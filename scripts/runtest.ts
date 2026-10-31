import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

const r = j.type<Token>().field({
    type: j.literal(TOKEN_TYPE.IDENTIFIER).select(),
    value: j.select('id'),
})

const eventPattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('이벤트'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.select('id'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.CLOSING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.select('firstSignature'),
        j.space(),
    ])
    .compile()
