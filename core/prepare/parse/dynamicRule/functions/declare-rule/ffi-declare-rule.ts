import { Evaluable, Expression, Identifier } from '../../../../../node/base.ts'
import { DeclareFFI, FFIBody } from '../../../../../node/ffi.ts'
import { EOL } from '../../../../../node/misc.ts'
import { Token } from '../../../../tokenize/token.ts'
import { PatternUnit, Rule } from '../../../type.ts'
import { extractParamNamesFromHeaderTokens } from '../../../../../util/extract-param-names-from-header-tokens.ts'
import { functionHeaderToPattern } from './common.ts'

const PREFIX: PatternUnit[] = [
    {
        type: Identifier,
        value: '번역',
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

const SUFFIX: PatternUnit[] = [
    {
        type: EOL,
    },
    {
        type: FFIBody,
    },
]

export function tokensToFFIDeclareRule(headerTokens: Token[]): Rule {
    const headerPattern = functionHeaderToPattern(headerTokens)
    const pattern = [...PREFIX, ...headerPattern, ...SUFFIX]

    return {
        pattern,
        factory: (nodes, matchedTokens) => {
            const runtime = (nodes[2] as Identifier).value
            const body = (nodes[nodes.length - 1] as FFIBody).code
            const name = headerTokens
                .map((token) => token.value)
                .join('')
                .trim()

            const paramNames = extractParamNamesFromHeaderTokens(headerTokens)

            return new DeclareFFI(
                {
                    name,
                    runtime,
                    body,
                    paramNames,
                },
                matchedTokens,
            )
        },
    }
}
