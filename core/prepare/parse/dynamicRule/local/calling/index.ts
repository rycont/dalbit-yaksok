import { ParameterElement, Rule } from '@dalbit-yaksok/core'
import { FunctionHeaderPart, FunctionPartType } from '../type.ts'
import { createInterleavingRule } from './interleaving.ts'
import { createBlockRule } from './block.ts'

export function createCallingRules(
    functionName: string,
    functionHeader: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
): Rule[] {
    const interleavingRule = createInterleavingRule(
        functionName,
        functionHeader,
        parameterScheme,
    )

    const isTrailingParameters =
        functionHeader.findIndex(
            (part) => part.type === FunctionPartType.parameter,
        ) ===
        functionHeader.length - 1

    if (!isTrailingParameters) {
        return [interleavingRule]
    }

    const blockRule = createBlockRule(
        functionName,
        functionHeader,
        parameterScheme,
    )
    return [interleavingRule, blockRule]
}
