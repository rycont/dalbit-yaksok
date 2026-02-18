import { Block, EOL, Evaluable, Identifier, Expression } from '../../../node/index.ts'
import { ListLoop } from '../../../node/listLoop.ts'
import { Rule, RULE_FLAGS } from '../type.ts'

export const LIST_LOOP_RULES: Rule[] = [
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
                value: '의',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: '마다',
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
            const name = (nodes[3] as Identifier).value
            const body = nodes[6] as Block

            return new ListLoop(list, name, body, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
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
                value: '의',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: '마다',
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
            const list = nodes[1] as Evaluable
            const name = (nodes[3] as Identifier).value
            const body = nodes[7] as Block

            return new ListLoop(list, name, body, tokens)
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
                value: '의',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: '마다',
            },
            {
                type: Identifier,
                value: '반복',
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
            const name = (nodes[2] as Identifier).value
            const body = nodes[7] as Block

            return new ListLoop(list, name, body, tokens)
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
                value: '의',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: '마다',
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
            const name = (nodes[2] as Identifier).value
            const body = nodes[6] as Block

            return new ListLoop(list, name, body, tokens)
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
                value: '의',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: '마다',
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
            const name = (nodes[2] as Identifier).value
            const body = nodes[6] as Block

            return new ListLoop(list, name, body, tokens)
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
                value: '의',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: '마다',
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
            const name = (nodes[2] as Identifier).value
            const body = nodes[6] as Block

            return new ListLoop(list, name, body, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
]
