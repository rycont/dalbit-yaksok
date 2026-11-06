import { Rule } from '@dalbit-yaksok/core'
import { FunctionPartType, FunctionSignature } from '../type'
import { createInterleavingRule } from './interleaving'
import { createBlockRule } from './block'
import { FunctionDeclareHeader } from '../node/header'

export function createCallingRules(
    signature: FunctionSignature,
    header: FunctionDeclareHeader,
): Rule[] {
    const interleavingRule = createInterleavingRule(signature, header)

    const isTrailingParameters =
        signature.headerParts.findIndex(
            (part) => part.type === FunctionPartType.parameter,
        ) ===
        signature.headerParts.length - 1

    if (!isTrailingParameters) {
        return [interleavingRule]
    }

    const blockRule = createBlockRule(signature, header)

    return [interleavingRule, blockRule]
}
