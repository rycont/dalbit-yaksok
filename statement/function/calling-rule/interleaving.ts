import { Rule, r } from '@dalbit-yaksok/core'

import { createCallingPattern } from './pattern.ts'
import { FunctionSignature } from '../type.ts'
import { FunctionInvoke } from '../node/invoke.ts'
import { FunctionDeclareHeader } from '../node/header.ts'

export function createInterleavingRule(
    signature: FunctionSignature,
    header: FunctionDeclareHeader,
): Rule {
    const { pattern, invokingArgumentsFactory } =
        createCallingPattern(signature)

    return r({
        pattern,
        factory(nodes, tokens) {
            const invokingArguments = invokingArgumentsFactory(nodes)

            if (invokingArguments === null) {
                return null
            }

            return new FunctionInvoke(
                signature.functionName,
                header,
                invokingArguments,
                tokens,
            )
        },
    })
}
