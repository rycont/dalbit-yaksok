import {
    AndOperator,
    BooleanLiteral,
    DivideOperator,
    EmptyLiteral,
    EOL,
    EqualOperator,
    Evaluable,
    Expression,
    Formula,
    GreaterThanOperator,
    GreaterThanOrEqualOperator,
    Identifier,
    IndexFetch,
    IntegerDivideOperator,
    LessThanOperator,
    LessThanOrEqualOperator,
    ListLiteral,
    MinusOperator,
    ModularOperator,
    MultiplyOperator,
    NotEqualOperator,
    NotExpression,
    Operator,
    OrOperator,
    PlusOperator,
    PowerOperator,
    r,
    RangeOperator,
    SRRule,
    Sequence,
    TupleLiteral,
    TypeCast,
    TypeCastTarget,
    TypeOf,
    ValueWithParenthesis,
} from '@dalbit-yaksok/core'

import { DICT_RULES } from './dict.ts'
import { STRING_RULES } from './template-string.ts'

import { j } from '@dalbit-yaksok/pattern'
export const BASIC_RULES: SRRule[][] = [
    [
        r({
            pattern: [
                j.instance(Evaluable),
                j.instance(Expression).field({ value: j.literal('[') }),
                j.instance(Evaluable),
                j.instance(Expression).field({ value: j.literal(']') }),
            ],
            factory: (nodes, tokens) => {
                const target = nodes[0]
                const index = nodes[2]

                return new IndexFetch(target, index, tokens)
            },
        }),
    ],
    STRING_RULES,
    [
        r({
            pattern: [
                j.instance(Expression).field({ value: j.literal('[') }),
                j.instance(Sequence),
                j.instance(Expression).field({ value: j.literal(']') }),
            ],
            factory: (nodes, tokens) => {
                const sequence = nodes[1]
                return new ListLiteral(sequence.items, nodes[2], tokens)
            },
        }),
        r({
            pattern: [
                j.instance(Identifier).field({ value: j.literal('비어있음') }),
            ],
            factory: (_, tokens) => {
                return new EmptyLiteral(tokens)
            },
        }),
        ...['참', '맞음'].map((keyword) =>
            r({
                pattern: [
                    j.instance(Identifier).field({ value: j.literal(keyword) }),
                ],
                factory: (_nodes, tokens) => {
                    return new BooleanLiteral(true, tokens)
                },
            }),
        ),
        ...['거짓', '아님'].map((keyword) =>
            r({
                pattern: [
                    j.instance(Identifier).field({ value: j.literal(keyword) }),
                ],
                factory: (_nodes, tokens) => {
                    return new BooleanLiteral(false, tokens)
                },
            }),
        ),
        r({
            pattern: [j.instance(EOL), j.instance(EOL)],
            factory: (nodes, tokens) => {
                const eol = nodes[0]
                eol.tokens = tokens
                return eol
            },
        }),
        r({
            pattern: [
                j.instance(Expression).field({ value: j.literal(',') }),
                j.instance(EOL),
            ],
            factory: (nodes, tokens) => {
                const comma = nodes[0]

                comma.tokens = tokens
                return comma
            },
        }),
    ],
    [
        r({
            pattern: [
                j.instance(Expression).field({ value: j.literal('(') }),
                j.instance(Expression).field({ value: j.literal(')') }),
            ],
            factory: (_nodes, tokens) => new TupleLiteral([], tokens),
        }),
        r({
            pattern: [
                j.instance(Expression).field({ value: j.literal('(') }),
                j.instance(Sequence),
                j.instance(Expression).field({ value: j.literal(')') }),
            ],
            factory: (nodes, tokens) => {
                const sequence = nodes[1]
                return new TupleLiteral(sequence.items, tokens)
            },
        }),
        r({
            pattern: [
                j.instance(Expression).field({ value: j.literal('(') }),
                j.instance(Evaluable),
                j.instance(Expression).field({ value: j.literal(',') }),
                j.instance(Expression).field({ value: j.literal(')') }),
            ],
            factory: (nodes, tokens) => {
                const item = nodes[1]
                return new TupleLiteral([item], tokens)
            },
        }),
        r({
            pattern: [
                j.instance(Expression).field({ value: j.literal('(') }),
                j.instance(Evaluable),
                j.instance(Expression).field({ value: j.literal(')') }),
            ],
            factory: (nodes, tokens) => {
                const item = nodes[1]
                return new ValueWithParenthesis(item, tokens)
            },
        }),
        r({
            pattern: [
                j.instance(Evaluable),
                j.instance(Operator),
                j.instance(Evaluable),
            ],
            factory: (nodes, tokens) => {
                const left = nodes[0]
                const operator = nodes[1]
                const right = nodes[2]

                if (left instanceof Formula) {
                    return new Formula(
                        [...left.subnode, operator, right],
                        tokens,
                    )
                }

                return new Formula([left, operator, right], tokens)
            },
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('!=') })],
            factory: (_nodes, tokens) => new NotEqualOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('==') })],
            factory: (_nodes, tokens) => new EqualOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('>') })],
            factory: (_nodes, tokens) => new GreaterThanOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('<') })],
            factory: (_nodes, tokens) => new LessThanOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('>=') })],
            factory: (_nodes, tokens) => new GreaterThanOrEqualOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('<=') })],
            factory: (_nodes, tokens) => new LessThanOrEqualOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('//') })],
            factory: (_nodes, tokens) => new IntegerDivideOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('%') })],
            factory: (_nodes, tokens) => new ModularOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('**') })],
            factory: (_nodes, tokens) => new PowerOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('/') })],
            factory: (_nodes, tokens) => new DivideOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('*') })],
            factory: (_nodes, tokens) => new MultiplyOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('+') })],
            factory: (nodes, tokens) => new PlusOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('-') })],
            factory: (nodes, tokens) => new MinusOperator(tokens),
        }),
        r({
            pattern: [
                j.instance(Identifier).field({ value: j.literal('이고') }),
            ],
            factory: (_nodes, tokens) => new AndOperator(tokens),
        }),
        r({
            pattern: [j.instance(Identifier).field({ value: j.literal('고') })],
            factory: (_nodes, tokens) => new AndOperator(tokens),
        }),
        r({
            pattern: [
                j.instance(Identifier).field({ value: j.literal('이거나') }),
            ],
            factory: (_nodes, tokens) => new OrOperator(tokens),
        }),
        r({
            pattern: [
                j.instance(Identifier).field({ value: j.literal('거나') }),
            ],
            factory: (_nodes, tokens) => new OrOperator(tokens),
        }),
        r({
            pattern: [j.instance(Operator).field({ value: j.literal('~') })],
            factory: (_nodes, tokens) => new RangeOperator(tokens),
        }),
        r({
            pattern: [
                j.instance(Expression).field({ value: j.literal('!') }),
                j.instance(Evaluable),
            ],
            factory: (nodes, tokens) => {
                const evaluable = nodes[1]
                return new NotExpression(evaluable, tokens)
            },
        }),
        r({
            pattern: [
                j.instance(Evaluable),
                j.instance(Identifier).field({ value: j.literal('아니다') }),
            ],
            factory: (nodes, tokens) => {
                const evaluable = nodes[0]
                return new NotExpression(evaluable, tokens)
            },
        }),
    ],
]

export const ADVANCED_RULES: SRRule[] = [
    r({
        pattern: [
            j.instance(Evaluable),
            j.instance(Expression).field({ value: j.literal(',') }),
            j.instance(Evaluable),
        ],
        factory: (nodes, tokens) => {
            const a = nodes[0]
            const b = nodes[2]

            return new Sequence([a, b], tokens)
        },
    }),
    r({
        pattern: [
            j.instance(Sequence),
            j.instance(Expression).field({ value: j.literal(',') }),
            j.instance(Evaluable),
        ],
        factory: (nodes, tokens) => {
            const a = nodes[0]
            const b = nodes[2]

            return new Sequence([...a.items, b], tokens)
        },
    }),
    r({
        pattern: [
            j.instance(Expression).field({ value: j.literal('[') }),
            j.instance(Expression).field({ value: j.literal(']') }),
        ],
        factory: (nodes, tokens) => new ListLiteral([], nodes[1], tokens),
    }),
    r({
        pattern: [
            j.instance(Evaluable),
            j.instance(Expression).field({ value: j.literal('의') }),
            j.instance(Expression).field({ value: j.literal('값') }),
            j.instance(Expression).field({ value: j.literal('종류') }),
        ],
        factory: (nodes, tokens) => {
            const value = nodes[0]
            return new TypeOf(value, tokens)
        },
    }),
    ...createTypeCastRules(),
    r({
        pattern: [
            j.instance(Expression).field({ value: j.literal('[') }),
            j.instance(Evaluable),
            j.instance(Expression).field({ value: j.literal(']') }),
        ],
        factory: (nodes, tokens) => {
            const item = nodes[1]
            return new ListLiteral([item], nodes[2], tokens)
        },
    }),
    ...DICT_RULES,
]

function createTypeCastRules(): SRRule[] {
    const particles = ['을', '를']
    const targetTypes: {
        keywords: string[]
        target: TypeCastTarget
        split?: [string, string][]
    }[] = [
        {
            keywords: ['숫자로'],
            target: '숫자',
            split: [['숫자', '로']],
        },
        {
            keywords: ['문자열로', '문자로'],
            target: '문자열',
            split: [
                ['문자열', '로'],
                ['문자', '로'],
            ],
        },
        {
            keywords: ['참거짓으로', '불리언으로'],
            target: '참거짓',
            split: [
                ['참거짓', '으로'],
                ['불리언', '으로'],
            ],
        },
    ]

    const rules: SRRule[] = []

    for (const particle of particles) {
        for (const { keywords, target, split } of targetTypes) {
            for (const keyword of keywords) {
                rules.push(
                    r({
                        pattern: [
                            j.instance(Evaluable),
                            j
                                .instance(Identifier)
                                .field({ value: j.literal(particle) }),
                            j
                                .instance(Identifier)
                                .field({ value: j.literal(keyword) }),
                            j
                                .instance(Identifier)
                                .field({ value: j.literal('바꾸기') }),
                        ],
                        factory: (nodes, tokens) => {
                            const value = nodes[0]
                            return new TypeCast(value, target, tokens)
                        },
                    }),
                )
            }

            if (split) {
                for (const [head, tail] of split) {
                    rules.push(
                        r({
                            pattern: [
                                j.instance(Evaluable),
                                j
                                    .instance(Identifier)
                                    .field({ value: j.literal(particle) }),
                                j
                                    .instance(Identifier)
                                    .field({ value: j.literal(head) }),
                                j
                                    .instance(Identifier)
                                    .field({ value: j.literal(tail) }),
                                j
                                    .instance(Identifier)
                                    .field({ value: j.literal('바꾸기') }),
                            ],
                            factory: (nodes, tokens) => {
                                const value = nodes[0]
                                return new TypeCast(value, target, tokens)
                            },
                        }),
                    )
                }
            }
        }
    }

    return rules
}
