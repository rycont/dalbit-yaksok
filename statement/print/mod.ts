import { Extension, Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { Print } from './node'

const pattern = j
    .type<Token[]>()
    .list([
        j.type<Token>().space().select('content'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('보여주기'),
        }),
    ])
    .compile()

const extension: Extension = {
    capabilties: {
        Grammer: [
            {
                name: '보여주기',
                factory(code, parse) {
                    const [line, consumed] = code.consume()
                    const test = pattern.func(pattern.id, line.validTokens)

                    if (!test) {
                        return null
                    }

                    const content = parse.value(test.content)
                    return {
                        instance: new Print(content, line.validTokens),
                        consumed,
                    }
                },
            },
        ],
    },
}

export default extension
