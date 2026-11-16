import { Token, TOKEN_TYPE, TokenRule } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { CountLoop } from './node'

const patternA = j
    .type<Token[]>()
    .list([
        j.type<Token>().space().select('count'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('번'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.enum(['반복', '반복하기']),
        }),
    ])
    .compile()

const patternB = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('반복'),
        }),
        j.type<Token>().space().select('count'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('번'),
        }),
    ])
    .compile()

const grammer: TokenRule = {
    name: '조건 반복',
    factory(line, action) {
        const test =
            patternA.func(patternA.id, line.validTokens) ||
            patternB.func(patternB.id, line.validTokens)

        if (!test) {
            return null
        }

        const count = action.parse(test.count)
        const body = action.parseFollowingBlock().consume()

        return {
            instance: new CountLoop(count, body, line.validTokens),
        }
    },
}

export default grammer
