import { Token, TOKEN_TYPE, RDRule } from '@dalbit-yaksok/core'
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

const grammer: RDRule = {
    name: '조건 반복',
    factory(code, parse) {
        const [line, lineConsumed] = code.consume()
        const test = pattern.func(pattern.id, line.validTokens)

        if (!test) {
            return null
        }

        if (!lineConsumed.block) {
            return null
        }

        const [bodyTokens, bodyConsumed] = lineConsumed.block.consume()
        const body = parse.statement(bodyTokens)

        return {
            instance: new UnconditionedLoop(body, line.validTokens),
            consumed: bodyConsumed,
        }
    },
}

export default grammer
