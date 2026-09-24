import { Block, EOL, Rule, SubscribeEvent } from '@dalbit-yaksok/core'
import { FunctionHeaderPart, 이벤트DeclareRange } from '../type.ts'
import { createCallingPattern } from './pattern.ts'

export function createEventSubscriptionRules(
    headerParts: FunctionHeaderPart[],
    range: 이벤트DeclareRange,
): Rule {
    const { pattern, evaluatorFactory } = createCallingPattern(headerParts)

    return {
        pattern: pattern.concat([EOL, Block]),
        factory(nodes, tokens) {
            const evaluator = evaluatorFactory(nodes.slice(0, -2))

            if (evaluator === null) {
                return null
            }

            const body = nodes.slice(-1)[0] as Block

            return new SubscribeEvent(range.id, body, evaluator, tokens)
        },
    }
}
