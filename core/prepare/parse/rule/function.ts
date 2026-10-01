import {
    FunctionDeclareHeader,
    DeclareFunction,
    Rule,
    Block,
    EOL,
    r,
    FFIBody,
    DeclareFFI,
    DeclareEvent,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { FunctionType } from '../dynamicRule/local/type.ts'

export const FUNCTION_RULES: Rule[] = [
    r({
        pattern: [
            j.instance(FunctionDeclareHeader<FunctionType.약속>).field({
                range: j.field(j.instance(j.literal(FunctionType.약속))),
            }),
            EOL,
            Block,
        ],
        factory(nodes, tokens) {
            const [header, _, body] = nodes

            return new DeclareFunction(body, header, tokens)
        },
    }),
    r({
        pattern: [
            u(
                FunctionDeclareHeader<FunctionType.번역>,
                v.object({
                    range: v.object(j.instance(v.literal(FunctionType.번역))),
                }),
            ),
            EOL,
            FFIBody,
        ],
        factory([header, __, body], tokens) {
            return new DeclareFFI(header, body.code, tokens)
        },
    }),
    r({
        pattern: [
            u(
                FunctionDeclareHeader<FunctionType.이벤트>,
                v.object({
                    range: v.object(j.instance(v.literal(FunctionType.이벤트))),
                }),
            ),
        ],
        factory([header], tokens) {
            return new DeclareEvent(header, tokens)
        },
    }),
]
