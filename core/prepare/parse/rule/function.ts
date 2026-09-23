import * as v from 'valibot'
import {
    FunctionDeclareHeader,
    DeclareFunction,
    Rule,
    Block,
    EOL,
    r,
    FFIBody,
} from '@dalbit-yaksok/core'
import { FunctionType } from '../dynamicRule/local/type.ts'

export const FUNCTION_RULES: Rule[] = [
    r({
        pattern: [
            {
                type: FunctionDeclareHeader,
                value: FunctionType.약속,
            },
            EOL,
            Block,
        ],
        factory(nodes, tokens) {
            const [header, _, body] = nodes

            return new DeclareFunction(
                body,
                header.name,
                header.invokingRules,
                header.parameterScheme,
                tokens,
            )
        },
    }),
    r({
        pattern: [
            {
                type: FunctionDeclareHeader,
                value: FunctionType.번역,
            },
            EOL,
            FFIBody,
        ],
        factory(nodes, tokens) {
            console.log(nodes)
            return null
        },
    }),
]
