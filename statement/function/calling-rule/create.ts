import { Rule } from '@dalbit-yaksok/core'
import { FunctionPartType, FunctionSignature } from '../type'
import { createInterleavingRule } from './interleaving'
import { createBlockRule } from './block'

export function createCallingRules(signature: FunctionSignature): Rule[] {
    const interleavingRule = createInterleavingRule(signature)

    const isTrailingParameters =
        signature.headerParts.findIndex(
            (part) => part.type === FunctionPartType.parameter,
        ) ===
        signature.headerParts.length - 1

    if (!isTrailingParameters) {
        return [interleavingRule]
    }

    const blockRule = createBlockRule(signature)

    return [interleavingRule, blockRule]
}
