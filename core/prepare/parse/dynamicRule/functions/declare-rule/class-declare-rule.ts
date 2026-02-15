import { Expression, Identifier } from '../../../../../node/base.ts'
import { Block } from '../../../../../node/block.ts'
import { DeclareClass } from '../../../../../node/class.ts'
import { EOL } from '../../../../../node/misc.ts'
import { type Token, TOKEN_TYPE } from '../../../../tokenize/token.ts'
import { PatternUnit, Rule } from '../../../type.ts'

const PREFIX: PatternUnit[] = [
    {
        type: Identifier,
        value: '클래스',
    },
    {
        type: Expression,
        value: ',',
    },
]

const SUFFIX: PatternUnit[] = [
    {
        type: EOL,
    },
    {
        type: Block,
    },
]

export function tokensToClassDeclareRule(headerTokens: Token[]): Rule {
    const nameToken = headerTokens.find((t) => t.type === TOKEN_TYPE.IDENTIFIER)
    const name = nameToken ? nameToken.value : ''

    const pattern: PatternUnit[] = [
        ...PREFIX,
        {
            type: Identifier,
            value: name,
        },
        ...SUFFIX,
    ]

    return {
        pattern,
        factory: (nodes, matchedNodes) => {
            const body = nodes[nodes.length - 1] as Block
            return new DeclareClass(name, body, matchedNodes)
        },
    }
}
