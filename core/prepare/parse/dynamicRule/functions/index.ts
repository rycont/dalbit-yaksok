import { convertTokensToFunctionTemplate } from './get-function-templates.ts'
import { tokensToFFIDeclareRule } from './declare-rule/ffi-declare-rule.ts'
import { createFunctionInvokeRule } from './invoke-rule.ts'

import { getFunctionDeclareRanges } from '../../../../util/get-function-declare-ranges.ts'
import { tokensToYaksokDeclareRule } from './declare-rule/yaksok-declare-rule.ts'
import { tokensToEventDeclareRule } from './declare-rule/event-declare-rule.ts'

import type { Token } from '../../../tokenize/token.ts'
import type { Rule } from '../../type.ts'
import { tokensToEventSubscribeRule } from './tokens-to-event-subscribe-rule.ts'

export function createLocalDynamicRules(
    tokens: Token[],
    functionDeclareRanges = getFunctionDeclareRanges(tokens),
): [Rule[][], Rule[][]] {
    const getTokensFromRange = getTokensFromRangeFactory(tokens)

    const yaksokHeaders = functionDeclareRanges.yaksok.map(getTokensFromRange)
    const ffiHeaders = functionDeclareRanges.ffi.map(getTokensFromRange)
    const eventHeaders = functionDeclareRanges.event.map(getTokensFromRange)

    const invokingRules = [...yaksokHeaders, ...ffiHeaders]
        .map(convertTokensToFunctionTemplate)
        .flatMap(createFunctionInvokeRule)
        .toSorted((a, b) => b.pattern.length - a.pattern.length)

    const eventSubscribeRules = eventHeaders.flatMap(tokensToEventSubscribeRule)

    const ffiDeclareRules = ffiHeaders.map(tokensToFFIDeclareRule)
    const yaksokDeclareRules = yaksokHeaders.map(tokensToYaksokDeclareRule)
    const eventDeclareRules = eventHeaders.map(tokensToEventDeclareRule)

    const declareRules = [
        ...ffiDeclareRules,
        ...yaksokDeclareRules,
        ...eventDeclareRules,
    ].toSorted((a, b) => b.pattern.length - a.pattern.length)

    return [[declareRules], [eventSubscribeRules, invokingRules]]
}

const getTokensFromRangeFactory =
    (tokens: Token[]) => (range: [number, number]) =>
        tokens.slice(range[0], range[1])
