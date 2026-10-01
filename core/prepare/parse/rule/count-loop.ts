import { j } from '@dalbit-yaksok/pattern'
import {
    Block,
    CompletionGroup,
    CountLoop,
    EOL,
    Evaluable,
    Identifier,
    Rule,
} from '@dalbit-yaksok/core'

export const COUNT_LOOP_RULES: Rule[] = [
    {
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
        config: {
            statement: {
                name: '몇 번 반복하기',
                group: CompletionGroup.LOOP,
                visibility: 'always',
            },
        },
    },
    {
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
        config: { statement: true },
    },
    {
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
        config: { statement: true },
    },
]
