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
        factory(nodes, tokens, scope) {
            const invokingArguments = invokingArgumentsFactory(
                nodes.slice(0, -2),
            )

            if (invokingArguments === null) {
                return null
            }

            return new StatementCaller(
                scope,
                (next, parse, scope) => {
                    const [_, lineConsumed] = next.consume()

                    if (!lineConsumed.block) {
                        throw '그건 말이 안됨'
                    }

                    const [bodyTokens, bodyConsumed] =
                        lineConsumed.block.consume()

                    const instance = new SubscribeEvent(
                        scope,
                        eventSlotKey,
                        callbackSlotKey,
                        parse.statement(bodyTokens),
                        invokingArguments,
                        tokens,
                    )

                    return {
                        instance,
                        consumed: bodyConsumed,
                    }
                },
                tokens,
            )
        },
    })

    return {
        sr: [srRule],
        rd: [],
    }
}
