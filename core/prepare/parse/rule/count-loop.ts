import { j } from '@dalbit-yaksok/pattern'
import {
    Block,
    CountLoop,
    EOL,
    Evaluable,
    Identifier,
    r,
    Rule,
} from '@dalbit-yaksok/core'

export const COUNT_LOOP_RULES: Rule[] = [
    r({
        pattern: [
            j.instance(Identifier).field({ value: j.literal('반복') }),
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('번') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const list = nodes[1]
            const body = nodes[4]

            return new CountLoop(list, body, tokens)
        },
        isStatement: true,
    }),
    r({
        pattern: [
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('번') }),
            j.instance(Identifier).field({ value: j.literal('반복') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const list = nodes[0]
            const body = nodes[4]

            return new CountLoop(list, body, tokens)
        },
        isStatement: true,
    }),
    r({
        pattern: [
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('번') }),
            j.instance(Identifier).field({ value: j.literal('반복하기') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const list = nodes[0]
            const body = nodes[4]

            return new CountLoop(list, body, tokens)
        },
        isStatement: true,
    }),
]
