import { RuleList, Scope, SlotKey } from '@dalbit-yaksok/core'
import { FunctionPartType, FunctionSignature, ParameterElement } from '../type'
import { createInterleavingRule } from './interleaving'
import { createBlockRule } from './block'
import { FunctionSlot } from '../slot'

export function createCallingRules(
    signature: FunctionSignature,
    // header: FunctionDeclareHeader,
    scope: Scope,
    slot: FunctionSlot,
    parameterSlots: Map<ParameterElement, SlotKey>,
): RuleList {
    const interleavingRule = createInterleavingRule(
        scope,
        slot,
        signature,
        parameterSlots,
    )

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

    const blockRule = createBlockRule(signature)

    return {
        sr: [interleavingRule],
        rd: [blockRule],
    }
}
