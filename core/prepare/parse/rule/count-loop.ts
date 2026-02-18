import { CountLoop } from '../../../node/count-loop.ts'
import { Block, EOL, Evaluable, Identifier, Expression } from '../../../node/index.ts'
import { Rule, RULE_FLAGS } from '../type.ts'

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
        flags: [RULE_FLAGS.IS_STATEMENT],
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
        flags: [RULE_FLAGS.IS_STATEMENT],
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
        flags: [RULE_FLAGS.IS_STATEMENT],
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
                type: Expression,
                value: ':',
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
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
]
