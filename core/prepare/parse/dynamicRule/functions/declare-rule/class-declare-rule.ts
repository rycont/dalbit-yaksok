import { Expression, Identifier } from '../../../../../node/base.ts'
import { Block } from '../../../../../node/block.ts'
import { DeclareClass } from '../../../../../node/class.ts'
import { EOL } from '../../../../../node/misc.ts'
import { Token } from '../../../../tokenize/token.ts'
import { PatternUnit, Rule } from '../../../type.ts'
import { functionHeaderToPattern } from './common.ts'

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
    const headerPattern = functionHeaderToPattern(headerTokens)
    const pattern = [...PREFIX, ...headerPattern, ...SUFFIX]

    return {
        pattern,
        factory: (nodes, matchedNodes) => {
            const body = nodes[nodes.length - 1] as Block

            // headerTokens contains: Name, (, Param, ), ...
            // But functionHeaderToPattern might have simplified them.
            // Let's find the first identifier in the header that is the name.
            const nameToken = headerTokens.find(t => t.type === 'IDENTIFIER')
            const name = nameToken ? nameToken.value : ''

            const params: string[] = []
            for (let i = 0; i < headerTokens.length; i++) {
                if (headerTokens[i].value === '(' && headerTokens[i + 1]) {
                    params.push(headerTokens[i + 1].value)
                }
            }

            return new DeclareClass(name, params, body, matchedNodes)
        },
    }
}
