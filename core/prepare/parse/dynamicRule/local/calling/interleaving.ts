import { FunctionInvoke, Rule, ParameterElement } from '@dalbit-yaksok/core'

import { FunctionHeaderPart } from '../type.ts'
import { createCallingPattern } from './pattern.ts'

export function createInterleavingRule(
    functionName: string,
    functionHeader: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
): Rule {
    const { pattern, invokingArgumentsFactory } = createCallingPattern(
        functionHeader,
        parameterScheme,
    )
    return {
        pattern,
        factory(nodes, tokens) {
            const invokingArguments = invokingArgumentsFactory(nodes)

            if (invokingArguments === null) {
                return null
            }

            return new FunctionInvoke(functionName, invokingArguments, tokens)
        },
    }
}
