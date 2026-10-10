import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

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
        j.space().select('이'),
    ])
    .compile()
