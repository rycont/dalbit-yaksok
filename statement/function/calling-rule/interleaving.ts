import { SRRule, Scope, SlotKey, r } from '@dalbit-yaksok/core'

import { createCallingPattern } from './pattern.ts'
import { FunctionSignature, ParameterElement } from '../type.ts'
import { FunctionInvoke } from '../node/invoke.ts'

export function createInterleavingRule(
    scope: Scope,
    slot: SlotKey,
    signature: FunctionSignature,
    parameterSlots: Map<ParameterElement, SlotKey>,
): SRRule {
    const { pattern, invokingArgumentsFactory } = createCallingPattern(
        scope,
        signature,
        parameterSlots,
    )

    return r({
        pattern,
        factory(nodes, tokens) {
            const invokingArguments = invokingArgumentsFactory(nodes)

            if (invokingArguments === null) {
                return null
            }

            return new FunctionInvoke(scope, slot, invokingArguments, tokens)
        },
    })
}
