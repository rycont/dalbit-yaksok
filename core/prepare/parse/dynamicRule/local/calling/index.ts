import { ParameterElement, Rule } from '@dalbit-yaksok/core'
import { FunctionHeaderPart, FunctionPartType } from '../type.ts'
import { createInterleavingRule } from './interleaving.ts'
import { createBlockRule } from './block.ts'

export function createCallingRules(
    functionName: string,
    headerParts: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
): Rule[] {
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
