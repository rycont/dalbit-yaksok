import { PatternUnit } from '../../../type.ts'
import { Rule } from '../../../rule/index.ts'
import { functionHeaderToPattern } from './common.ts'
import { DeclareEvent } from '../../../../../node/event.ts'
import { Evaluable, Expression, Identifier } from '../../../../../node/base.ts'
import { Token } from '../../../../tokenize/token.ts'

const PREFIX: PatternUnit[] = [
    {
        type: Identifier,
        value: '이벤트',
    },
    {
        type: Expression,
        value: '(',
    },
    {
        type: Evaluable,
    },
    {
        type: Expression,
        value: ')',
    },
    {
        type: Expression,
        value: ',',
    },
]

export function tokensToEventDeclareRule(headerTokens: Token[]): Rule {
    const pattern = [
        ...PREFIX,
        ...functionHeaderToPattern(headerTokens.slice(6)),
    ]

    return {
        pattern,
        factory: (nodes, matchedTokens) => {
            const eventId = (nodes[2] as Identifier).value
            const name = headerTokens
                .map((token) => token.value)
                .join('')
                .trim()

            return new DeclareEvent(
                {
                    name,
                    eventId,
                },
                matchedTokens,
            )
        },
    }
}
