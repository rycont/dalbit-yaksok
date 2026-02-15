import {
    Evaluable,
    Identifier,
    Expression,
    Sequence,
    TupleLiteral,
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

    // Python: <expr> . name() - () becomes TupleLiteral([]) after tuple parsing
    {
        pattern: [
            { type: Evaluable },
            { type: Expression, value: '.' },
            { type: Identifier },
            { type: TupleLiteral },
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0] as Evaluable
            const methodName = (nodes[2] as Identifier).value
            const tuple = nodes[3] as TupleLiteral
            return new PythonMethodCall(target, methodName, tuple.items, tokens)
        },
    },
    // Python: <expr> . name(<expr>) - (expr) becomes ValueWithParenthesis
    {
        pattern: [
            { type: Evaluable },
            { type: Expression, value: '.' },
            { type: Identifier },
            { type: ValueWithParenthesis },
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0] as Evaluable
            const methodName = (nodes[2] as Identifier).value
            const wrapped = nodes[3] as ValueWithParenthesis
            return new PythonMethodCall(target, methodName, [wrapped.value], tokens)
        },
    },
    // Python: func() - () becomes TupleLiteral([]) after tuple parsing
    // Python: func(<a>, <b>, ...) - (a,b,...) becomes TupleLiteral
    {
        pattern: [{ type: Identifier }, { type: TupleLiteral }],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            const tuple = nodes[1] as TupleLiteral
            return new PythonCall(name, tuple.items, tokens)
        },
    },
    // Python: func(<expr>) - (expr) becomes ValueWithParenthesis
    {
        pattern: [{ type: Identifier }, { type: ValueWithParenthesis }],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            const wrapped = nodes[1] as ValueWithParenthesis
            return new PythonCall(name, [wrapped.value], tokens)
        },
    },
]
