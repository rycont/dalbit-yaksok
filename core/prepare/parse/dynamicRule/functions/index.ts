import { convertTokensToFunctionTemplate } from './get-function-templates.ts'
import { tokensToFFIDeclareRule } from './declare-rule/ffi-declare-rule.ts'
import { createFunctionInvokeRule } from './invoke-rule.ts'

import { getFunctionDeclareRanges } from '../../../../util/get-function-declare-ranges.ts'
import { tokensToYaksokDeclareRule } from './declare-rule/yaksok-declare-rule.ts'

import type { Token } from '../../../tokenize/token.ts'
import type { Rule } from '../../type.ts'

export function createLocalDynamicRules(
    tokens: Token[],
    functionDeclareRanges = getFunctionDeclareRanges(tokens),
): [Rule[][], Rule[][]] {
    const getTokensFromRange = getTokensFromRangeFactory(tokens)

    const yaksokHeaders = functionDeclareRanges.yaksok.map(getTokensFromRange)
    const ffiHeaders = functionDeclareRanges.ffi.map(getTokensFromRange)

    const invokingRules = [...yaksokHeaders, ...ffiHeaders]
        .map(convertTokensToFunctionTemplate)
        .flatMap(createFunctionInvokeRule)
        .toSorted((a, b) => b.pattern.length - a.pattern.length)

    const ffiDeclareRules = ffiHeaders.map(tokensToFFIDeclareRule)

    const yaksokDeclareRules = yaksokHeaders.map(tokensToYaksokDeclareRule)
    const declareRules = [...ffiDeclareRules, ...yaksokDeclareRules].toSorted(
        (a, b) => b.pattern.length - a.pattern.length,
    )

    return [[declareRules], [invokingRules]]
}

const getTokensFromRangeFactory =
    (tokens: Token[]) => (range: [number, number]) =>
        tokens.slice(range[0], range[1])
