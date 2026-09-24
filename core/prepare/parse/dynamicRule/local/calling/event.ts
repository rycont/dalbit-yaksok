import {
    Block,
    EOL,
    ParameterElement,
    Rule,
    SubscribeEvent,
} from '@dalbit-yaksok/core'
import { FunctionHeaderPart, 이벤트DeclareRange } from '../type.ts'
import { createCallingPattern } from './pattern.ts'

export function createEventSubscriptionRules(
    headerParts: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
    range: 이벤트DeclareRange,
): Rule {
    const { pattern, invokingArgumentsFactory } = createCallingPattern(
        headerParts,
        parameterScheme,
    )

    return {
        pattern: pattern.concat([EOL, Block]),
        factory(nodes, tokens) {
            const invokingArguments = invokingArgumentsFactory(
                nodes.slice(0, -2),
            )

            if (invokingArguments === null) {
                return null
            }

            const body = nodes.slice(-1)[0] as Block

            return new SubscribeEvent(range.id, body, invokingArguments, tokens)
        },
    }
}
