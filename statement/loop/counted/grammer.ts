import { Token, TOKEN_TYPE, RDRule } from '@dalbit-yaksok/core'
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

const grammer: RDRule = {
    name: '조건 반복',
    factory(code, parse, scope) {
        const [line, lineConsumed] = code.consume()

        const test =
            patternA.func(patternA.id, line.validTokens) ||
            patternB.func(patternB.id, line.validTokens)

        if (!test || !lineConsumed.block) {
            return null
        }

        const count = parse.value(test.count)
        const [bodyTokens, bodyConsumed] = lineConsumed.block.consume()

        const body = parse.statement(bodyTokens)

        return {
            instance: new CountLoop(scope, count, body, line.validTokens),
            consumed: bodyConsumed,
        }
    },
}

export default grammer
