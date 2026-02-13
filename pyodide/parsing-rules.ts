import {
    Evaluable,
    Identifier,
    Expression,
    Sequence,
    ValueWithParenthesis,
    RULE_FLAGS,
    type Rule,
} from '@dalbit-yaksok/core'
import {
    PythonImport,
    PythonMethodCall,
    PythonCall,
    PythonAttributeAccess,
    PythonCallableCall,
} from './python.ts'

function moduleExprToString(node: unknown): string | null {
    if (node instanceof Identifier) {
        return node.value
    }

    if (node instanceof PythonAttributeAccess) {
        const left = moduleExprToString(node.target)
        if (!left) return null
        return `${left}.${node.attrName}`
    }

    return null
}

export const PARSING_RULES: Rule[] = [
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

    // Python: from <module_expr> import <a>,<b>,...
    {
        pattern: [
            {
                type: Identifier,
                value: 'from',
            },
            {
                type: PythonAttributeAccess,
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
            const module = moduleExprToString(nodes[1]) || ''
            const seq = nodes[3] as Sequence
            const names = seq.items.map((it) => (it as Identifier).value)
            return new PythonImport(module, names, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: from <module_expr> import <name>
    {
        pattern: [
            {
                type: Identifier,
                value: 'from',
            },
            {
                type: PythonAttributeAccess,
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
            const module = moduleExprToString(nodes[1]) || ''
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
    // Python: <expr> . attr
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
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0] as Evaluable
            const attrName = (nodes[2] as Identifier).value
            return new PythonAttributeAccess(target, attrName, tokens)
        },
    },
    // Python: <expr.attr>()
    {
        pattern: [
            {
                type: PythonAttributeAccess,
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
            return new PythonCallableCall(
                nodes[0] as PythonAttributeAccess,
                [],
                tokens,
            )
        },
    },
    // Python: <expr.attr>(<expr>)
    {
        pattern: [
            {
                type: PythonAttributeAccess,
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
            return new PythonCallableCall(
                nodes[0] as PythonAttributeAccess,
                [nodes[2] as Evaluable],
                tokens,
            )
        },
    },
    // Python: <expr.attr>(<a>, <b>, ...)
    {
        pattern: [
            {
                type: PythonAttributeAccess,
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
            const seq = nodes[2] as Sequence
            return new PythonCallableCall(
                nodes[0] as PythonAttributeAccess,
                seq.items as Evaluable[],
                tokens,
            )
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
