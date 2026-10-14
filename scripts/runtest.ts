import { FunctionDeclareHeader, Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { FunctionType } from '../core/prepare/parse/dynamicRule/local/type.ts'

const r = j.field({
    value: j.select('runtime'),
})

const 번역Pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('번역'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
        }),
        j.field({
            value: j.select('runtime'),
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