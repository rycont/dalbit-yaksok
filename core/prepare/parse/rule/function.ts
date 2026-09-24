import * as v from 'valibot'
import {
    FunctionDeclareHeader,
    DeclareFunction,
    Rule,
    Block,
    EOL,
    r,
    FFIBody,
    u,
    DeclareFFI,
} from '@dalbit-yaksok/core'
import { FunctionType } from '../dynamicRule/local/type.ts'

export const FUNCTION_RULES: Rule[] = [
    r({
        pattern: [
            u(
                FunctionDeclareHeader<FunctionType.약속>,
                v.object({
                    range: v.object({
                        type: v.literal(FunctionType.약속),
                    }),
                }),
            ),
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
            u(
                FunctionDeclareHeader<FunctionType.번역>,
                v.object({
                    range: v.object({
                        type: v.literal(FunctionType.번역),
                    }),
                }),
            ),
            EOL,
            FFIBody,
        ],
        factory([header, __, body], tokens) {
            return new DeclareFFI(
                header.name,
                body.code,
                header.range.runtime,
                header.invokingRules,
                tokens,
            )
        },
    }),
]
