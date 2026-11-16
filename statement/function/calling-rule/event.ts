import { j } from '@dalbit-yaksok/pattern'
import { FunctionSignature } from '../type'
import {
    Block,
    EOL,
    Node,
    PatternUnitChain,
    r,
    RuleList,
} from '@dalbit-yaksok/core'
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
        pattern: (pattern as PatternUnitChain<Node>[]).concat([
            j.instance(EOL),
            j.instance(Block),
        ]),
        factory(nodes, tokens) {
            const invokingArguments = invokingArgumentsFactory(
                nodes.slice(0, -2),
            )

            if (invokingArguments === null) {
                return null
            }

            const body = nodes.slice(-1)[0] as Block

            return new SubscribeEvent(
                declareHeader,
                body,
                invokingArguments,
                tokens,
            )
        },
    })

    return {
        sr: [srRule],
        rd: [],
    }
}
