import { CountLoop } from '../../../node/count-loop.ts'
import { Block, EOL, Evaluable, Identifier } from '../../../node/index.ts'
import { CompletionGroup, Rule } from '../type.ts'

export const COUNT_LOOP_RULES: Rule[] = [
    {
        pattern: [
            {
                type: Identifier,
                value: '반복',
            },
            {
                type: Evaluable,
            },
            {
                type: Identifier,
                value: '번',
            },
            {
                type: EOL,
            },
            {
                type: Block,
            },
        ],
        factory: (nodes, tokens) => {
            const list = nodes[1] as Evaluable
            const body = nodes[4] as Block

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
            {
                type: Evaluable,
            },
            {
                type: Identifier,
                value: '번',
            },
            {
                type: Identifier,
                value: '반복',
            },
            {
                type: EOL,
            },
            {
                type: Block,
            },
        ],
        factory: (nodes, tokens) => {
            const list = nodes[0] as Evaluable
            const body = nodes[4] as Block

            return new CountLoop(list, body, tokens)
        },
        config: { statement: true },
    },
    {
        pattern: [
            {
                type: Evaluable,
            },
            {
                type: Identifier,
                value: '번',
            },
            {
                type: Identifier,
                value: '반복하기',
            },
            {
                type: EOL,
            },
            {
                type: Block,
            },
        ],
        factory: (nodes, tokens) => {
            const list = nodes[0] as Evaluable
            const body = nodes[4] as Block

            return new CountLoop(list, body, tokens)
        },
        config: { statement: true },
    },
]
