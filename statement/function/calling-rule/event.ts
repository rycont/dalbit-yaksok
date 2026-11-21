import { FunctionSignature } from '../type'
import { r, RuleList, StatementCaller } from '@dalbit-yaksok/core'
import { createCallingPattern } from './pattern'
import { SubscribeEvent } from '../node/event'
import { FunctionDeclareHeader } from '../node/header'

export function createEventSubscriptionRules(
    signature: FunctionSignature,
    declareHeader: FunctionDeclareHeader,
): RuleList {
    const { pattern, invokingArgumentsFactory } =
        createCallingPattern(signature)

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
                        declareHeader,
                        body,
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
