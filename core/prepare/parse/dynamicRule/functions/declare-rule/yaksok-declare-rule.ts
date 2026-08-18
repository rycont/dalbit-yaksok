import { Expression, Identifier } from '../../../../../node/base.ts'
import { Block } from '../../../../../node/block.ts'
import { DeclareFunction } from '../../../../../node/function.ts'
import { TupleLiteral } from '../../../../../node/list.ts'
import { EOL } from '../../../../../node/misc.ts'
import { Token } from '../../../../tokenize/token.ts'
import { PatternUnit, Rule } from '../../../type.ts'
import { convertTokensToFunctionTemplate } from '../get-function-templates.ts'
import { functionHeaderToPattern } from './common.ts'

const PREFIX: PatternUnit[] = [
    {
        type: Identifier,
        value: '약속',
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

export function tokensToYaksokDeclareRule(headerTokens: Token[]): Rule {
    const headerPattern = functionHeaderToPattern(headerTokens)
    const functionTemplate = convertTokensToFunctionTemplate(headerTokens)

    const pattern = [...PREFIX, ...headerPattern, ...SUFFIX]

    return {
        pattern,
        factory: (nodes, matchedNodes) => {
            const body = nodes[nodes.length - 1] as Block

            const name = headerTokens
                .map((token) => token.value)
                .join('')
                .trim()

            return new DeclareFunction(
                {
                    body,
                    name,
                    parameterElements: functionTemplate.parameterScheme,
                },
                matchedNodes,
            )
        },
    }
}
