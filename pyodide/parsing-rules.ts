import {
    Evaluable,
    Expression,
    FetchMember,
    Identifier,
    type Rule,
    RULE_FLAGS,
    Sequence,
    TupleLiteral,
    ValueWithParenthesis,
} from '@dalbit-yaksok/core'
import { PythonCall, PythonImport } from './python.ts'

function isPythonIdentifierName(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
}

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
            return new PythonImport(
                `from ${module} import ${names.join(', ')}`,
                tokens,
            )
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
            return new PythonImport(`from ${module} import ${name}`, tokens)
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
            return new PythonImport(
                `from ${module} import ${names.join(', ')}`,
                tokens,
            )
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
            return new PythonImport(`from ${module} import ${name}`, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: import <module>
    {
        pattern: [
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
            return new PythonImport(`import ${module}`, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: import <module> as <alias>
    {
        pattern: [
            {
                type: Identifier,
                value: 'import',
            },
            {
                type: Identifier,
            },
            {
                type: Identifier,
                value: 'as',
            },
            {
                type: Identifier,
            },
        ],
        factory: (nodes, tokens) => {
            const module = (nodes[1] as Identifier).value
            const alias = (nodes[3] as Identifier).value
            return new PythonImport(`import ${module} as ${alias}`, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: import <module>.<submodule>
    {
        pattern: [
            {
                type: Identifier,
                value: 'import',
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
        ],
        factory: (nodes, tokens) => {
            const base = (nodes[1] as Identifier).value
            const sub = (nodes[3] as Identifier).value
            return new PythonImport(`import ${base}.${sub}`, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    // Python: import <module>.<submodule> as <alias>
    {
        pattern: [
            {
                type: Identifier,
                value: 'import',
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
                value: 'as',
            },
            {
                type: Identifier,
            },
        ],
        factory: (nodes, tokens) => {
            const base = (nodes[1] as Identifier).value
            const sub = (nodes[3] as Identifier).value
            const alias = (nodes[5] as Identifier).value
            return new PythonImport(`import ${base}.${sub} as ${alias}`, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },

    // Python: <expr.name>(...), ...  (after dot-fetch reduced first)
    {
        pattern: [{ type: FetchMember }, { type: Sequence }],
        factory: (nodes, tokens) => {
            const fetched = nodes[0] as FetchMember
            const methodName = fetched.memberName
            if (!isPythonIdentifierName(methodName)) {
                return null
            }

            const sequence = nodes[1] as Sequence
            const [first, ...rest] = sequence.items

            if (!first) {
                return null
            }

            let methodArgs: Evaluable[]
            if (first instanceof TupleLiteral) {
                methodArgs = first.items
            } else if (first instanceof ValueWithParenthesis) {
                methodArgs = [first.value]
            } else {
                return null
            }

            const methodCall = new PythonCall(fetched, methodArgs, [
                ...fetched.tokens,
                ...first.tokens,
            ])

            if (rest.length === 0) {
                return methodCall
            }

            return new Sequence([methodCall, ...rest], tokens)
        },
    },
    // Python: <expr.name>(<a>, <b>, ...) - (a,b,...) becomes TupleLiteral
    {
        pattern: [{ type: FetchMember }, { type: TupleLiteral }],
        factory: (nodes, tokens) => {
            const fetched = nodes[0] as FetchMember
            if (!isPythonIdentifierName(fetched.memberName)) {
                return null
            }
            const tuple = nodes[1] as TupleLiteral
            return new PythonCall(fetched, tuple.items, tokens)
        },
    },
    // Python: <expr.name>(<expr>) - (expr) becomes ValueWithParenthesis
    {
        pattern: [{ type: FetchMember }, { type: ValueWithParenthesis }],
        factory: (nodes, tokens) => {
            const fetched = nodes[0] as FetchMember
            if (!isPythonIdentifierName(fetched.memberName)) {
                return null
            }
            const wrapped = nodes[1] as ValueWithParenthesis
            return new PythonCall(fetched, [wrapped.value], tokens)
        },
    },
    // Python: <expr>.<python-call(...)> where call part was reduced first
    {
        pattern: [
            { type: Evaluable },
            { type: Expression, value: '.' },
            { type: PythonCall },
        ],
        factory: (nodes, tokens) => {
            const base = nodes[0] as Evaluable
            const call = nodes[2] as PythonCall
            const mergedCallable = prependTarget(base, call.callable)
            if (!mergedCallable) {
                return null
            }

            return new PythonCall(mergedCallable, call.args, tokens)
        },
    },
    // Python: func() - () becomes TupleLiteral([]) after tuple parsing
    // Python: func(<a>, <b>, ...) - (a,b,...) becomes TupleLiteral
    {
        pattern: [{ type: Identifier }, { type: TupleLiteral }],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            if (!isPythonIdentifierName(name)) {
                return null
            }
            const tuple = nodes[1] as TupleLiteral
            return new PythonCall(nodes[0] as Identifier, tuple.items, tokens)
        },
    },
    // Python: func(<expr>) - (expr) becomes ValueWithParenthesis
    {
        pattern: [{ type: Identifier }, { type: ValueWithParenthesis }],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            if (!isPythonIdentifierName(name)) {
                return null
            }
            const wrapped = nodes[1] as ValueWithParenthesis
            return new PythonCall(
                nodes[0] as Identifier,
                [wrapped.value],
                tokens,
            )
        },
    },
]

function prependTarget(
    base: Evaluable,
    callable: Identifier | FetchMember,
): FetchMember | null {
    if (callable instanceof Identifier) {
        if (!isPythonIdentifierName(callable.value)) {
            return null
        }

        return new FetchMember(base, callable.value, [
            ...base.tokens,
            ...callable.tokens,
        ])
    }

    const callableTarget = callable.target
    if (
        !(callableTarget instanceof Identifier) &&
        !(callableTarget instanceof FetchMember)
    ) {
        return null
    }

    const mergedParent = prependTarget(base, callableTarget)
    if (!mergedParent || !isPythonIdentifierName(callable.memberName)) {
        return null
    }

    return new FetchMember(mergedParent, callable.memberName, [
        ...mergedParent.tokens,
        ...callable.tokens,
    ])
}
