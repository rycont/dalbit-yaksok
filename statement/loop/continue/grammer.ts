import { Token, TOKEN_TYPE, RDRule } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { Continue } from './node'

const pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('다음'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('반복'),
        }),
    ])
    .compile()

const grammer: RDRule = {
    name: '조건 반복',
    factory(code) {
        const [line, consumed] = code.consume()
        const test = pattern.func(pattern.id, line.validTokens)

        if (!test) {
            return null
        }

        return {
            instance: new Continue(line.validTokens),
            consumed,
        }
    },
}

export default grammer
