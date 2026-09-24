import { FunctionInvoke, Rule, ParameterElement } from '@dalbit-yaksok/core'

import { FunctionHeaderPart } from '../type.ts'
import { createCallingPattern } from './pattern.ts'

export function createInterleavingRule(
    functionName: string,
    functionHeader: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
): Rule {
    const { pattern, evaluatorFactory } = createCallingPattern(functionHeader)
    return {
        pattern,
        factory(nodes, tokens) {
            const argumentEvaluator = evaluatorFactory(nodes)

            if (argumentEvaluator === null) {
                return null
            }

            return new FunctionInvoke(
                functionName,
                argumentEvaluator,
                parameterScheme,
                tokens,
            )
        },
    }
}
