import { getFunctionDeclareRanges } from '../../../../util/get-function-declare-ranges.ts'
import type { Rule } from '../../../parse/type.ts'
import type { Token } from '../../../tokenize/token.ts'
import { tokensToFFIDeclareRule } from './declare-rule/ffi-declare-rule.ts'

import { convertTokensToFunctionTemplate } from './get-function-templates.ts'
import { createFunctionInvokeRule } from './invoke-rule.ts'

export function createLocalDynamicRules(
    tokens: Token[],
    functionDeclareRanges = getFunctionDeclareRanges(tokens),
) {
    const getTokensFromRange = getTokensFromRangeFactory(tokens)

    const yaksokHeaders = functionDeclareRanges.yaksok.map(getTokensFromRange)
    const ffiHeaders = functionDeclareRanges.ffi.map(getTokensFromRange)

    const invokingRules = [...yaksokHeaders, ...ffiHeaders]
        .map(convertTokensToFunctionTemplate)
        .flatMap(createFunctionInvokeRule)

    const ffiDeclareRules = ffiHeaders.map(tokensToFFIDeclareRule)

    const rules = [...invokingRules, ...ffiDeclareRules].toSorted(
        (a, b) => b.pattern.length - a.pattern.length,
    )

    // console.log(rules)
    return rules
}

const getTokensFromRangeFactory =
    (tokens: Token[]) => (range: [number, number]) =>
        tokens.slice(range[0], range[1])
