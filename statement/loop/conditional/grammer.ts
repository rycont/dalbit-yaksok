import { Token, TOKEN_TYPE, TokenRule } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { ConditionalLoop } from './node'

const pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('반복'),
        }),
        j.type<Token>().space().select('condition'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('동안'),
        }),
    ])
    .compile()

const grammer: TokenRule = {
    name: '조건 반복',
    factory(line, action) {
        const test = pattern.func(pattern.id, line.validTokens)

        if (!test) {
            return null
        }

        const condition = action.parse(test.condition)
        const body = action.parseFollowingBlock().consume()

        return {
            instance: new ConditionalLoop(condition, body, line.validTokens),
        }
    },
}

export default grammer
