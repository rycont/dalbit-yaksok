import { Evaluable, Expression, Identifier } from '../../../../../node/base.ts'
import { Block } from '../../../../../node/block.ts'
import { DeclareFunction } from '../../../../../node/function.ts'
import { EOL } from '../../../../../node/misc.ts'
import { extractParamNamesFromHeaderTokens } from '../../../../../util/extract-param-names-from-header-tokens.ts'
import { Token, TOKEN_TYPE } from '../../../../tokenize/token.ts'
import { PatternUnit, Rule } from '../../../type.ts'
import { functionHeaderToPattern } from './common.ts'

const PREFIX: PatternUnit[] = [
    {
        type: Identifier,
        value: '메소드',
    },
    {
        type: Evaluable,
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

export function tokensToMethodDeclareRule(
    prefixTokens: Token[],
    headerTokens: Token[],
    receiverTypeNames: string[],
): Rule[] {
    const headerPattern = functionHeaderToPattern(headerTokens)
    const rawPrefixPattern = tokensToPattern(prefixTokens)
    const reducedPrefixPattern = PREFIX
    const patterns = [rawPrefixPattern, reducedPrefixPattern]

    return patterns.map((prefixPattern) => ({
        pattern: [...prefixPattern, ...headerPattern, ...SUFFIX],
        factory: (nodes, matchedNodes) => {
            const body = nodes[nodes.length - 1] as Block

            const name = headerTokens
                .map((token) => token.value)
                .join('')
                .trim()

            const paramNames = extractParamNamesFromHeaderTokens(headerTokens)

            return new DeclareFunction(
                {
                    body,
                    name,
                    paramNames,
                    dotReceiverTypeNames: receiverTypeNames,
                },
                matchedNodes,
            )
        },
    }))
}

function tokensToPattern(tokens: Token[]): PatternUnit[] {
    const units: PatternUnit[] = []
    for (const token of tokens) {
        if (token.type === TOKEN_TYPE.SPACE) {
            continue
        }
        if (token.type === TOKEN_TYPE.IDENTIFIER) {
            units.push({
                type: Identifier,
                value: token.value,
            })
            continue
        }
        if (token.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            units.push({
                type: Expression,
                value: '(',
            })
            continue
        }
        if (token.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            units.push({
                type: Expression,
                value: ')',
            })
            continue
        }
        if (token.type === TOKEN_TYPE.COMMA) {
            units.push({
                type: Expression,
                value: ',',
            })
        }
    }
    return units
}
