import {
    Block,
    ElseIfStatement,
    ElseStatement,
    EOL,
    Evaluable,
    Expression,
    Identifier,
    IfStatement,
    WhileStatement,
} from '../../../node/index.ts'
import { Rule, RULE_FLAGS } from '../type.ts'

export const PYTHON_COMPAT_RULES: Rule[] = [
    {
        pattern: [
            {
                type: Identifier,
                value: 'else',
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
            const body = nodes[3] as Block

            return new ElseStatement(body, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: 'elif',
            },
            {
                type: Evaluable,
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
            const condition = nodes[1] as Evaluable
            const body = nodes[4] as Block

            return new ElseIfStatement({ condition, body }, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: 'if',
            },
            {
                type: Evaluable,
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
            const condition = nodes[1] as Evaluable
            const body = nodes[4] as Block

            return new IfStatement([{ condition, body }], tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: 'while',
            },
            {
                type: Evaluable,
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
            const condition = nodes[1] as Evaluable
            const body = nodes[4] as Block

            return new WhileStatement(condition, body, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
]
