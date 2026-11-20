import { RuleList } from '@dalbit-yaksok/core'
import { FunctionPartType, FunctionSignature } from '../type'
import { createInterleavingRule } from './interleaving'
import { createBlockRule } from './block'
import { FunctionDeclareHeader } from '../node/header'

export function createCallingRules(
    signature: FunctionSignature,
    header: FunctionDeclareHeader,
): RuleList {
    const interleavingRule = createInterleavingRule(signature, header)

    const isTrailingParameters =
        signature.headerParts.findIndex(
            (part) => part.type === FunctionPartType.parameter,
        ) ===
        signature.headerParts.length - 1

    if (!isTrailingParameters) {
        return {
            sr: [interleavingRule],
            rd: [],
        }
    }

    const blockRule = createBlockRule(signature, header)

    return {
        sr: [interleavingRule],
        rd: [blockRule],
    }
}
