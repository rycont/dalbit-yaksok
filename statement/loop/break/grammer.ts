import { Token, TOKEN_TYPE, TokenRule } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { Break } from './node'

const pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('반복'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('그만'),
        }),
    ])
    .compile()

const grammer: TokenRule = {
    name: '조건 반복',
    factory(line) {
        const test = pattern.func(pattern.id, line.validTokens)

        if (!test) {
            return null
        }

        return {
            instance: new Break(line.validTokens),
        }
    },
}

export default grammer
