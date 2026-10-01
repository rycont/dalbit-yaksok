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
                range: j.field({
                    type: j.literal(FunctionType.약속),
                }),
            }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory(nodes, tokens) {
            const [header, _, body] = nodes

            return new DeclareFunction(body, header, tokens)
        },
    }),
    r({
        pattern: [
            j.instance(FunctionDeclareHeader<FunctionType.번역>).field({
                range: j.field({
                    type: j.literal(FunctionType.번역),
                }),
            }),
            j.instance(EOL),
            j.instance(FFIBody),
        ],
        factory([header, __, body], tokens) {
            return new DeclareFFI(header, body.code, tokens)
        },
    }),
    r({
        pattern: [
            j.instance(FunctionDeclareHeader<FunctionType.이벤트>).field({
                range: j.field({
                    type: j.literal(FunctionType.이벤트),
                }),
            }),
        ],
        factory([header], tokens) {
            return new DeclareEvent(header, tokens)
        },
    }),
]
