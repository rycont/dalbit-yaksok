import { Token, TOKEN_TYPE, RDRule } from '@dalbit-yaksok/core'
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

const grammer: RDRule = {
    name: '조건 반복',
    factory(code, parse, scope) {
        const [line, lineConsumed] = code.consume()

        const test = pattern.func(pattern.id, line.validTokens)

        if (!test || !lineConsumed.block) {
            return null
        }

        const condition = parse.value(test.condition)

        const [bodyTokens, bodyConsumed] = lineConsumed.block.consume()
        const body = parse.statement(bodyTokens)

        return {
            instance: new ConditionalLoop(
                scope,
                condition,
                body,
                line.validTokens,
            ),
            consumed: bodyConsumed,
        }
    },
}

export default grammer
