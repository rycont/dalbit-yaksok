import { FunctionSignature, ParameterElement } from '../type'
import {
    r,
    RuleList,
    Scope,
    SlotKey,
    StatementCaller,
} from '@dalbit-yaksok/core'
import { createCallingPattern } from './pattern'
import { SubscribeEvent } from '../node/event'

export function createEventSubscriptionRules(
    signature: FunctionSignature,
    eventSlotKey: SlotKey,
    scope: Scope,
    parameterSlots: Map<ParameterElement, SlotKey>,
    callbackSlotKey: SlotKey,
): RuleList {
    const { pattern, invokingArgumentsFactory } = createCallingPattern(
        scope,
        signature,
        parameterSlots,
    )

    const srRule = r({
        pattern: pattern,
        factory(nodes, tokens) {
            const invokingArguments = invokingArgumentsFactory(
                nodes.slice(0, -2),
            )

            if (invokingArguments === null) {
                return null
            }

            return new StatementCaller(
                (body) =>
                    new SubscribeEvent(
                        scope,
                        eventSlotKey,
                        callbackSlotKey,
                        body.parsed,
                        invokingArguments,
                        tokens,
                    ),
            )
        },
    })

    return {
        sr: [srRule],
        rd: [],
    }
}
