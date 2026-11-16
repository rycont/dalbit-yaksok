import { Token, TOKEN_TYPE, TokenRule } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { UnconditionedLoop } from './node'

const pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.enum(['반복', '반복하기']),
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

        const body = action.parseFollowingBlock().consume()

        return {
            instance: new UnconditionedLoop(body, line.validTokens),
        }
    },
}

export default grammer
