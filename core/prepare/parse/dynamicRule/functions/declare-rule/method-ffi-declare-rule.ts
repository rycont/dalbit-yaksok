import { Evaluable, Expression, Identifier } from '../../../../../node/base.ts'
import { DeclareFFI, FFIBody } from '../../../../../node/ffi.ts'
import { EOL } from '../../../../../node/misc.ts'
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
    {
        type: Identifier,
        value: '번역',
    },
    {
        type: Expression,
        value: '(',
    },
    {
        type: Identifier,
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

const SUFFIX: PatternUnit[] = [
    {
        type: EOL,
    },
    {
        type: FFIBody,
    },
]

export function tokensToMethodFFIDeclareRule(
    prefixTokens: Token[],
    headerTokens: Token[],
    receiverTypeNames: string[],
): Rule[] {
    const headerPattern = functionHeaderToPattern(headerTokens)
    const rawPrefixPattern = tokensToPattern(prefixTokens)
    const reducedPrefixPattern = PREFIX

    return [rawPrefixPattern, reducedPrefixPattern].map((prefixPattern) => ({
        pattern: [...prefixPattern, ...headerPattern, ...SUFFIX],
        factory: (nodes, matchedTokens) => {
            const translateIndex = nodes.findIndex(
                (node) => node instanceof Identifier && node.value === '번역',
            )
            const runtimeNode = nodes[translateIndex + 2]
            if (!(runtimeNode instanceof Identifier)) {
                return null
            }

            const runtime = runtimeNode.value
            const body = (nodes[nodes.length - 1] as FFIBody).code
            const name = headerTokens
                .map((token) => token.value)
                .join('')
                .trim()

            return new DeclareFFI(
                {
                    name,
                    runtime,
                    body,
                    dotReceiverTypeNames: receiverTypeNames,
                },
                matchedTokens,
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
