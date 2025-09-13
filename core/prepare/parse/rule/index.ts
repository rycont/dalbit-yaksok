import {
    Formula,
    NotExpression,
    ValueWithParenthesis,
} from '../../../node/calculation.ts'
import {
    AndOperator,
    Block,
    Break,
    DivideOperator,
    ElseIfStatement,
    ElseStatement,
    EOL,
    EqualOperator,
    Evaluable,
    Expression,
    GreaterThanOperator,
    GreaterThanOrEqualOperator,
    Identifier,
    IfStatement,
    IndexFetch,
    IntegerDivideOperator,
    LessThanOperator,
    LessThanOrEqualOperator,
    ListLiteral,
    Loop,
    MinusOperator,
    ModularOperator,
    MultiplyOperator,
    Operator,
    OrOperator,
    Pause,
    PlusOperator,
    PowerOperator,
    Print,
    RangeOperator,
    Sequence,
    SetToIndex,
    SetVariable,
    TypeOf,
    PythonCall,
    PythonImport,
} from '../../../node/index.ts'
import { NotEqualOperator } from '../../../node/operator.ts'
import { ReturnStatement } from '../../../node/return.ts'
import { IndexedValue } from '../../../value/indexed.ts'
import { NumberValue, StringValue } from '../../../value/primitive.ts'
import { ASSIGNERS } from '../../tokenize/rules.ts'
import type { Rule } from '../type.ts'
import { RULE_FLAGS } from '../type.ts'
import { COUNT_LOOP_RULES } from './count-loop.ts'
import { DICT_RULES } from './dict.ts'
import { LIST_LOOP_RULES } from './list-loop.ts'
import { PYTHON_COMPAT_RULES } from './python-compat.ts'

export type { Rule }
export const BASIC_RULES: Rule[][] = [
    [
        {
            pattern: [
                {
                    type: EOL,
                },
                {
                    type: EOL,
                },
            ],
            factory: (nodes, tokens) => {
                const eol = nodes[0] as EOL
                eol.tokens = tokens
                return eol
            },
        },
        {
            pattern: [
                {
                    type: Expression,
                    value: ',',
                },
                {
                    type: EOL,
                },
            ],
            factory: (nodes, tokens) => {
                const comma = nodes[0] as Expression
                const eol = nodes[1] as EOL

                comma.tokens = tokens
                return comma
            },
        },
        {
            pattern: [
                {
                    type: Evaluable,
                },
                {
                    type: Expression,
                    value: '[',
                },
                {
                    type: Evaluable,
                },
                {
                    type: Expression,
                    value: ']',
                },
            ],
            factory: (nodes, tokens) => {
                const target = nodes[0] as Evaluable<IndexedValue>
                const index = nodes[2] as Evaluable<StringValue | NumberValue>

                return new IndexFetch(target, index, tokens)
            },
        },
    ],
    [
        {
            pattern: [
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
                const newNode = new ValueWithParenthesis(
                    nodes[1] as Evaluable,
                    tokens,
                )
                newNode.position = nodes[0].position

                return newNode
            },
        },
        {
            pattern: [
                {
                    type: Expression,
                    value: '[',
                },
                {
                    type: Sequence,
                },
                {
                    type: Expression,
                    value: ']',
                },
            ],
            factory: (nodes, tokens) => {
                const sequence = nodes[1] as Sequence
                return new ListLiteral(sequence.items, tokens)
            },
        },
        {
            pattern: [
                {
                    type: Evaluable,
                },
                {
                    type: Operator,
                },
                {
                    type: Evaluable,
                },
            ],
            factory: (nodes, tokens) => {
                const left = nodes[0] as Evaluable
                const operator = nodes[1] as Operator
                const right = nodes[2] as Evaluable

                if (left instanceof Formula) {
                    return new Formula([...left.terms, operator, right], tokens)
                }

                return new Formula([left, operator, right], tokens)
            },
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '!=',
                },
            ],
            factory: (_nodes, tokens) => new NotEqualOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '==',
                },
            ],
            factory: (_nodes, tokens) => new EqualOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '>',
                },
            ],
            factory: (_nodes, tokens) => new GreaterThanOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '<',
                },
            ],
            factory: (_nodes, tokens) => new LessThanOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '>=',
                },
            ],
            factory: (_nodes, tokens) => new GreaterThanOrEqualOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '<=',
                },
            ],
            factory: (_nodes, tokens) => new LessThanOrEqualOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '//',
                },
            ],
            factory: (_nodes, tokens) => new IntegerDivideOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '%',
                },
            ],
            factory: (_nodes, tokens) => new ModularOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '**',
                },
            ],
            factory: (_nodes, tokens) => new PowerOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '/',
                },
            ],
            factory: (_nodes, tokens) => new DivideOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '*',
                },
            ],
            factory: (_nodes, tokens) => new MultiplyOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '+',
                },
            ],
            factory: (_nodes, tokens) => new PlusOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '-',
                },
            ],
            factory: (_nodes, tokens) => new MinusOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Identifier,
                    value: '이고',
                },
            ],
            factory: (_nodes, tokens) => new AndOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Identifier,
                    value: '고',
                },
            ],
            factory: (_nodes, tokens) => new AndOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Identifier,
                    value: '이거나',
                },
            ],
            factory: (_nodes, tokens) => new OrOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Identifier,
                    value: '거나',
                },
            ],
            factory: (_nodes, tokens) => new OrOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Operator,
                    value: '~',
                },
            ],
            factory: (_nodes, tokens) => new RangeOperator(tokens),
        },
        {
            pattern: [
                {
                    type: Expression,
                    value: '!',
                },
                {
                    type: Evaluable,
                },
            ],
            factory: (nodes, tokens) => {
                const evaluable = nodes[1] as Evaluable
                return new NotExpression(evaluable, tokens)
            },
        },
    ],
]

export const ADVANCED_RULES: Rule[] = [
    {
        pattern: [
            {
                type: Identifier,
                value: '잠깐',
            },
            {
                type: Identifier,
                value: '멈추기',
            },
        ],
        factory: (_nodes, tokens) => new Pause(tokens),
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    ...PYTHON_COMPAT_RULES,
    {
        pattern: [
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: ',',
            },
            {
                type: Evaluable,
            },
        ],
        factory: (nodes, tokens) => {
            const a = nodes[0] as Evaluable
            const b = nodes[2] as Evaluable

            return new Sequence([a, b], tokens)
        },
    },
    {
        pattern: [
            {
                type: Sequence,
            },
            {
                type: Expression,
                value: ',',
            },
            {
                type: Evaluable,
            },
        ],
        factory: (nodes, tokens) => {
            const a = nodes[0] as Sequence
            const b = nodes[2] as Evaluable

            return new Sequence([...a.items, b], tokens)
        },
    },
    {
        pattern: [
            {
                type: Expression,
                value: '[',
            },
            {
                type: Expression,
                value: ']',
            },
        ],
        factory: (_nodes, tokens) => new ListLiteral([], tokens),
    },

    ...ASSIGNERS.map<Rule>((assigner) => ({
        pattern: [
            {
                type: IndexFetch,
            },
            {
                type: Expression,
                value: assigner,
            },
            {
                type: Evaluable,
            },
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0] as IndexFetch
            const operator = nodes[1] as Expression
            const value = nodes[2] as Evaluable

            return new SetToIndex(target, value, operator.value, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    })),
    ...ASSIGNERS.map<Rule>((assigner) => ({
        pattern: [
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: assigner,
            },
            {
                type: Evaluable,
            },
        ],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            const operator = nodes[1] as Expression
            const value = nodes[2] as Evaluable

            return new SetVariable(name, value, tokens, operator.value)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    })),
    {
        pattern: [
            {
                type: IfStatement,
            },
            {
                type: EOL,
            },
            {
                type: ElseIfStatement,
            },
        ],
        factory: (nodes, tokens) => {
            const [ifStatement, _, elseIfStatement] = nodes as [
                IfStatement,
                EOL,
                ElseIfStatement,
            ]

            const elseIfCase = elseIfStatement.elseIfCase
            ifStatement.cases.push(elseIfCase)

            ifStatement.tokens = tokens

            return ifStatement
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: IfStatement,
            },
            {
                type: EOL,
            },
            {
                type: ElseStatement,
            },
        ],
        factory: (nodes, tokens) => {
            const [ifStatement, _, elseStatement] = nodes as [
                IfStatement,
                EOL,
                ElseStatement,
            ]

            const elseCase = {
                body: elseStatement.body,
            }

            ifStatement.cases.push(elseCase)
            ifStatement.tokens = tokens

            return ifStatement
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: '아니면',
            },
            {
                type: Identifier,
                value: '만약',
            },
            {
                type: Evaluable,
            },
            {
                type: Identifier,
                value: '이면',
            },
            {
                type: EOL,
            },
            {
                type: Block,
            },
        ],
        factory: (nodes, tokens) => {
            const condition = nodes[2] as Evaluable
            const body = nodes[5] as Block

            return new ElseIfStatement({ condition, body }, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: '아니면',
            },
            {
                type: EOL,
            },
            {
                type: Block,
            },
        ],
        factory: (nodes, tokens) => {
            const body = nodes[2] as Block

            return new ElseStatement(body, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: '만약',
            },
            {
                type: Evaluable,
            },
            {
                type: Identifier,
                value: '이면',
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
                type: Evaluable,
            },
            {
                type: Identifier,
                value: '의',
            },
            {
                type: Identifier,
                value: '값',
            },
            {
                type: Identifier,
                value: '종류',
            },
        ],
        factory: (nodes, tokens) => {
            const value = nodes[0] as Evaluable
            return new TypeOf(value, tokens)
        },
    },
    {
        pattern: [
            {
                type: Evaluable,
            },
            {
                type: Identifier,
                value: '보여주기',
            },
        ],
        factory: (nodes, tokens) => {
            const value = nodes[0] as Evaluable
            return new Print(value, tokens)
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
                value: '반환하기',
            },
        ],
        factory: (nodes, tokens) => {
            const value = nodes[0] as Evaluable
            return new ReturnStatement(tokens, value)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: '반환하기',
            },
        ],
        factory: (_nodes, tokens) => {
            return new ReturnStatement(tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: '약속',
            },
            {
                type: Identifier,
                value: '그만',
            },
        ],
        factory: (_nodes, tokens) => {
            return new ReturnStatement(tokens)
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
                type: EOL,
            },
            {
                type: Block,
            },
        ],
        factory: (nodes, tokens) => new Loop(nodes[2] as Block, tokens),
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
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
        factory: (nodes, tokens) => new Loop(nodes[2] as Block, tokens),
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    {
        pattern: [
            {
                type: Identifier,
                value: '반복',
            },
            {
                type: Identifier,
                value: '그만',
            },
        ],
        factory: (_nodes, tokens) => new Break(tokens),
        flags: [RULE_FLAGS.IS_STATEMENT],
    },
    ...LIST_LOOP_RULES,
    ...COUNT_LOOP_RULES,
    {
        pattern: [
            {
                type: Expression,
                value: '[',
            },
            {
                type: Evaluable,
            },
            {
                type: Expression,
                value: ']',
            },
        ],
        factory: (nodes, tokens) => {
            const item = nodes[1] as Evaluable
            return new ListLiteral([item], tokens)
        },
    },
    ...DICT_RULES,
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
            return new PythonImport(module, name, tokens)
        },
        flags: [RULE_FLAGS.IS_STATEMENT],
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
            }
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
            }
        ],
        factory: (nodes, tokens) => {
            const name = (nodes[0] as Identifier).value
            const seq = nodes[1] as ValueWithParenthesis
            return new PythonCall(name, [seq.value], tokens)
        },
    },
]
