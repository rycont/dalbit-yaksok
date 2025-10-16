import {
    Evaluable,
    Identifier,
    Expression,
    Sequence,
    ValueWithParenthesis,
    RULE_FLAGS,
    type Rule,
} from '@dalbit-yaksok/core'
import { PythonImport, PythonMethodCall, PythonCall } from './python.ts'

export const PARSING_RULES: Rule[] = [
    // Python: from <module>.<submodule> import <a>,<b>,...
    {
        pattern: [
            {
                type: Identifier,
                value: 'from',
            },
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '.',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: 'import',
            },
            {
                type: Sequence,
            },
        ],
        factory: (nodes, tokens) => {
            const base = (nodes[1] as Identifier).value
            const sub = (nodes[3] as Identifier).value
            const module = `${base}.${sub}`
            const seq = nodes[5] as Sequence
            const names = seq.items.map((it) => (it as Identifier).value)
            return new PythonImport(module, names, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: from <module>.<submodule> import <name>
    {
        pattern: [
            {
                type: Identifier,
                value: 'from',
            },
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '.',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: 'import',
            },
            {
                type: Identifier,
            },
        ],
        factory: (nodes, tokens) => {
            const base = (nodes[1] as Identifier).value
            const sub = (nodes[3] as Identifier).value
            const module = `${base}.${sub}`
            const name = (nodes[5] as Identifier).value
            return new PythonImport(module, [name], tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: from <module> import <a>,<b>,...
    {
        pattern: [
            {
                type: Identifier,
                value: 'from',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: 'import',
            },
            {
                type: Sequence,
            },
        ],
        factory: (nodes, tokens) => {
            const module = (nodes[1] as Identifier).value
            const seq = nodes[3] as Sequence
            const names = seq.items.map((it) => (it as Identifier).value)
            return new PythonImport(module, names, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: from <module> import <name>
    {
        pattern: [
            {
                type: Identifier,
                value: 'from',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: 'import',
            },
            {
                type: Identifier,
            },
        ],
        factory: (nodes, tokens) => {
            const module = (nodes[1] as Identifier).value
            const name = (nodes[3] as Identifier).value
            return new PythonImport(module, [name], tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },

    // Python: <expr> . name()
    {
        pattern: [
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: '.',
            },
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '(',
            },
            {
                type: Expression,
                value: ')',
            },
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0] as Evaluable
            const methodName = (nodes[2] as Identifier).value
            return new PythonMethodCall(target, methodName, [], tokens)
        },
    },
    // Python: <expr> . name(<expr>)
    {
        pattern: [
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: '.',
            },
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '(',
            },
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: ')',
            },
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0] as Evaluable
            const methodName = (nodes[2] as Identifier).value
            const arg = nodes[4] as Evaluable
            return new PythonMethodCall(target, methodName, [arg], tokens)
        },
    },
    // Python: <expr> . name(<a>, <b>, ...)
    {
        pattern: [
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: '.',
            },
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '(',
            },
            {
                type: Sequence,
            },
            {
                type: Expression,
                value: ')',
            },
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0] as Evaluable
            const methodName = (nodes[2] as Identifier).value
            const seq = nodes[4] as Sequence
            return new PythonMethodCall(target, methodName, seq.items, tokens)
        },
    },
    // Python: func()
    {
        pattern: [
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '(',
            },
            {
                type: Expression,
                value: ')',
            },
        ],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            return new PythonCall(name, [], tokens)
        },
    },
    // Python: func(<expr>)
    {
        pattern: [
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '(',
            },
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: ')',
            },
        ],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            const v = nodes[2] as Evaluable
            return new PythonCall(name, [v], tokens)
        },
    },
    // // Python: func(<a>, <b>, ...)
    {
        pattern: [
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: '(',
            },
            {
                type: Sequence,
            },
            {
                type: Expression,
                value: ')',
            },
        ],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            const seq = nodes[2] as Sequence
            return new PythonCall(name, seq.items, tokens)
        },
    },
    {
        pattern: [
            {
                type: Identifier,
            },
            {
                type: ValueWithParenthesis,
            },
        ],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            const seq = nodes[1] as ValueWithParenthesis
            return new PythonCall(name, [seq.value], tokens)
        },
    },
]
