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
    const identifierTokens = headerTokens.filter(
        (t) => t.type === TOKEN_TYPE.IDENTIFIER,
    )
    const name = identifierTokens[0]?.value || ''
    const parentName = identifierTokens[1]?.value
    const hasPythonStyleInheritance = headerTokens.some(
        (t) => t.type === TOKEN_TYPE.OPENING_PARENTHESIS,
    )

    const pattern: PatternUnit[] = [
        ...PREFIX,
        {
            type: Identifier,
            value: name,
        },
        ...(parentName
            ? hasPythonStyleInheritance
                ? ([
                      {
                          type: Expression,
                          value: '(',
                      },
                      {
                          type: Identifier,
                          value: parentName,
                      },
                      {
                          type: Expression,
                          value: ')',
                      },
                  ] as PatternUnit[])
                : ([
                      {
                          type: Expression,
                          value: ',',
                      },
                      {
                          type: Identifier,
                          value: parentName,
                      },
                  ] as PatternUnit[])
            : []),
        ...SUFFIX,
    ]

    return {
        pattern,
        factory: (nodes, matchedNodes) => {
            const body = nodes[nodes.length - 1] as Block
            return new DeclareClass(name, body, matchedNodes, parentName)
        },
    }
}
