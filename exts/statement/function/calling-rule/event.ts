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
    declaredScope: Scope,
    parameterSlots: Map<ParameterElement, SlotKey>,
    callbackSlotKey: SlotKey,
): RuleList {
    const { pattern, invokingArgumentsFactory } = createCallingPattern(
        declaredScope,
        signature,
        parameterSlots,
    )

    const srRule = r({
        pattern: pattern,
        factory(nodes, tokens) {
            const invokingArguments = invokingArgumentsFactory(nodes)

            if (invokingArguments === null) {
                return null
            }

            return new StatementCaller(
                declaredScope,
                (next, parse, bodyParsingScope) => {
                    const [_, lineConsumed] = next.consume()

                    if (!lineConsumed.block) {
                        throw '그건 말이 안됨'
                    }

                    const [bodyTokens, bodyConsumed] =
                        lineConsumed.block.consume()

                    const childScope = new Scope({
                        parent: bodyParsingScope,
                    })

                    const instance = new SubscribeEvent(
                        declaredScope,
                        eventSlotKey,
                        callbackSlotKey,
                        parse.statement(bodyTokens, childScope),
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
