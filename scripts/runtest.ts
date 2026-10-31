import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { ChainShapeBase, j } from '@dalbit-yaksok/pattern'

const r = new j<Token, ChainShapeBase>().field({
    type: j.literal(TOKEN_TYPE.CLOSING_PARENTHESIS).select(),
})

const 번역Pattern = j.type<Token[]>().list([
    j.field({
        type: j.literal(TOKEN_TYPE.IDENTIFIER),
        value: j.literal('번역'),
    }),
    j.field({
        type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
    }),
    j.field({
        value: j.select('runtime'),
        // inm: j.select('ir'),
    }),
    j.field({
        type: j.literal(TOKEN_TYPE.CLOSING_PARENTHESIS),
    }),
    j
        .field({
            type: j.literal(TOKEN_TYPE.COMMA),
        })
        .select('R'),
    // j.select('firstSignature'),
    // j.space().select('뭐시기'),
])
