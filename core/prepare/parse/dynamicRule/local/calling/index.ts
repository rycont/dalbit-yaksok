import { ParameterElement, Rule } from '@dalbit-yaksok/core'
import {
    FunctionDeclareRange,
    FunctionHeaderPart,
    FunctionPartType,
    FunctionType,
} from '../type.ts'
import { createInterleavingRule } from './interleaving.ts'
import { createBlockRule } from './block.ts'
import { createEventSubscriptionRules } from './event.ts'

export function createCallingRules(
    functionName: string,
    headerParts: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
    range: FunctionDeclareRange,
): Rule[] {
    if (range.type === FunctionType.이벤트) {
        return [createEventSubscriptionRules(headerParts, range)]
    }

    const interleavingRule = createInterleavingRule(
        functionName,
        headerParts,
        parameterScheme,
    )

    const isTrailingParameters =
        headerParts.findIndex(
            (part) => part.type === FunctionPartType.parameter,
        ) ===
        headerParts.length - 1

    if (!isTrailingParameters) {
        return [interleavingRule]
    }

    const blockRule = createBlockRule(
        functionName,
        headerParts,
        parameterScheme,
    )

    return [interleavingRule, blockRule]
}
