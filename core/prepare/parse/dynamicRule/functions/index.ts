import { Rule, Token } from '@dalbit-yaksok/core'
import { getDeclareSignature } from './get-function-declare-ranges.ts'
import { buildRules } from './build-rules.ts'

export function createLocalDynamicRules(tokens: Token[]): [Rule[][], Rule[][]] {
    const declareSignatures = getDeclareSignature(tokens)
    const { declareRules, callingRules } = buildRules(tokens, declareSignatures)

    return [declareRules, callingRules]
}
