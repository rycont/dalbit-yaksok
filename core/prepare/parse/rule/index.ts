import {
    AndOperator,
    Block,
    BooleanLiteral,
    Break,
    CompletionGroup,
    ConditionalLoop,
    Continue,
    DivideOperator,
    ElseIfStatement,
    ElseStatement,
    EmptyLiteral,
    EOL,
    EqualOperator,
    Evaluable,
    Expression,
    Formula,
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
    NodeCapability,
    NotEqualOperator,
    NotExpression,
    Operator,
    OrOperator,
    PlusOperator,
    PowerOperator,
    Print,
    RangeOperator,
    ReturnStatement,
    Rule,
    Sequence,
    SetToIndex,
    SetVariable,
    TupleLiteral,
    TypeCast,
    TypeCastTarget,
    TypeOf,
    ValueWithParenthesis,
} from '@dalbit-yaksok/core'

import { COUNT_LOOP_RULES } from './count-loop.ts'
import { DICT_RULES } from './dict.ts'
import { LIST_LOOP_RULES } from './list-loop.ts'
import { STRING_RULES } from './template-string.ts'
import { FUNCTION_RULES } from './function.ts'
import { ASSIGNERS } from '../../tokenize/rules.ts'
import { j } from '@dalbit-yaksok/pattern'

export const BASIC_RULES: Rule[][] = [
    [
        {
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
        },
    ],
    STRING_RULES,
    FUNCTION_RULES,
    [
        {
            pattern: [
                j.instance(Expression).field({ value: j.literal('[') }),
                j.instance(Sequence),
                j.instance(Expression).field({ value: j.literal(']') }),
            ],
            factory: (nodes, tokens) => {
                const sequence = nodes[1]
                return new ListLiteral(sequence.items, nodes[2], tokens)
            },
        },
        {
            pattern: [
                j.instance(Identifier).field({ value: j.literal('비어있음') }),
            ],
            factory: (_, tokens) => {
                return new EmptyLiteral(tokens)
            },
        },
        ...['참', '맞음'].map(
            (keyword) =>
                ({
                    pattern: [
                        j
                            .instance(Identifier)
                            .field({ value: j.literal(keyword) }),
                    ],
                    factory: (_nodes, tokens) => {
                        return new BooleanLiteral(true, tokens)
                    },
                }) as Rule,
        ),
        ...['거짓', '아님'].map(
            (keyword) =>
                ({
                    pattern: [
                        j
                            .instance(Identifier)
                            .field({ value: j.literal(keyword) }),
                    ],
                    factory: (_nodes, tokens) => {
                        return new BooleanLiteral(false, tokens)
                    },
                }) as Rule,
        ),
        {
            pattern: [j.instance(EOL), j.instance(EOL)],
            factory: (nodes, tokens) => {
                const eol = nodes[0]
                eol.tokens = tokens
                return eol
            },
        },
        {
            pattern: [
                j.instance(Expression).field({ value: j.literal(',') }),
                j.instance(EOL),
            ],
            factory: (nodes, tokens) => {
                const comma = nodes[0]

                comma.tokens = tokens
                return comma
            },
        },
    ],
    [
        {
            pattern: [
                j.instance(Expression).field({ value: j.literal('(') }),
                j.instance(Expression).field({ value: j.literal(')') }),
            ],
            factory: (_nodes, tokens) => new TupleLiteral([], tokens),
        },
        {
            pattern: [
                j.instance(Expression).field({ value: j.literal('(') }),
                j.instance(Sequence),
                j.instance(Expression).field({ value: j.literal(')') }),
            ],
            factory: (nodes, tokens) => {
                const sequence = nodes[1]
                return new TupleLiteral(sequence.items, tokens)
            },
        },
        {
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
        },
        {
            pattern: [
                j.instance(Expression).field({ value: j.literal('(') }),
                j.instance(Evaluable),
                j.instance(Expression).field({ value: j.literal(')') }),
            ],
            factory: (nodes, tokens) => {
                const item = nodes[1]
                return new ValueWithParenthesis(item, tokens)
            },
        },
        {
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
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('!=') })],
            factory: (_nodes, tokens) => new NotEqualOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('==') })],
            factory: (_nodes, tokens) => new EqualOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('>') })],
            factory: (_nodes, tokens) => new GreaterThanOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('<') })],
            factory: (_nodes, tokens) => new LessThanOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('>=') })],
            factory: (_nodes, tokens) => new GreaterThanOrEqualOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('<=') })],
            factory: (_nodes, tokens) => new LessThanOrEqualOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('//') })],
            factory: (_nodes, tokens) => new IntegerDivideOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('%') })],
            factory: (_nodes, tokens) => new ModularOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('**') })],
            factory: (_nodes, tokens) => new PowerOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('/') })],
            factory: (_nodes, tokens) => new DivideOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('*') })],
            factory: (_nodes, tokens) => new MultiplyOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('+') })],
            factory: (nodes, tokens) => new PlusOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('-') })],
            factory: (nodes, tokens) => new MinusOperator(tokens),
        },
        {
            pattern: [
                j.instance(Identifier).field({ value: j.literal('이고') }),
            ],
            factory: (_nodes, tokens) => new AndOperator(tokens),
        },
        {
            pattern: [j.instance(Identifier).field({ value: j.literal('고') })],
            factory: (_nodes, tokens) => new AndOperator(tokens),
        },
        {
            pattern: [
                j.instance(Identifier).field({ value: j.literal('이거나') }),
            ],
            factory: (_nodes, tokens) => new OrOperator(tokens),
        },
        {
            pattern: [
                j.instance(Identifier).field({ value: j.literal('거나') }),
            ],
            factory: (_nodes, tokens) => new OrOperator(tokens),
        },
        {
            pattern: [j.instance(Operator).field({ value: j.literal('~') })],
            factory: (_nodes, tokens) => new RangeOperator(tokens),
        },
        {
            pattern: [
                j.instance(Expression).field({ value: j.literal('!') }),
                j.instance(Evaluable),
            ],
            factory: (nodes, tokens) => {
                const evaluable = nodes[1]
                return new NotExpression(evaluable, tokens)
            },
        },
        {
            pattern: [
                j.instance(Evaluable),
                j.instance(Identifier).field({ value: j.literal('아니다') }),
            ],
            factory: (nodes, tokens) => {
                const evaluable = nodes[0]
                return new NotExpression(evaluable, tokens)
            },
        },
    ],
]

export const ADVANCED_RULES: Rule[] = [
    {
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
    },
    {
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
    },
    {
        pattern: [
            j.instance(Expression).field({ value: j.literal('[') }),
            j.instance(Expression).field({ value: j.literal(']') }),
        ],
        factory: (nodes, tokens) => new ListLiteral([], nodes[1], tokens),
    },
    ...ASSIGNERS.map<Rule>((assigner) => ({
        pattern: [
            j.instance(IndexFetch),
            j.instance(Expression).field({ value: j.literal(assigner) }),
            j.instance(Evaluable),
        ],
        factory: (nodes, tokens) => {
            const target = nodes[0]
            const operator = nodes[1]
            const value = nodes[2]

            return new SetToIndex(target, value, operator.value, tokens)
        },
        config: {
            statement:
                assigner === '='
                    ? {
                          name: '목록 안의 값 바꾸기',
                          group: CompletionGroup.DATA,
                          visibility: 'always',
                      }
                    : true,
        },
    })),
    ...ASSIGNERS.map<Rule>((assigner) => ({
        pattern: [
            j.instance(Identifier),
            j.instance(Expression).field({ value: j.literal(assigner) }),
            j.instance(Evaluable),
        ],
        factory: (nodes, tokens) => {
            const name = nodes[0].value
            const operator = nodes[1]
            const value = nodes[2]

            return new SetVariable(name, value, tokens, operator.value)
        },
        config: {
            statement:
                assigner === '='
                    ? {
                          name: '변수에 값 넣기',
                          group: CompletionGroup.DATA,
                          visibility: 'always',
                      }
                    : true,
        },
    })),
    {
        pattern: [
            j.instance(IfStatement),
            j.instance(EOL),
            j.instance(ElseIfStatement),
        ],
        factory: ([ifStatement, _, elseIfStatement], tokens) => {
            const elseIfCase = elseIfStatement.elseIfCase
            ifStatement.cases.push(elseIfCase)

            ifStatement.tokens = tokens

            return ifStatement
        },
        config: { statement: true },
    },
    {
        pattern: [
            j.instance(IfStatement),
            j.instance(EOL),
            j.instance(ElseStatement),
        ],
        factory: ([ifStatement, _, elseStatement], tokens) => {
            const elseCase = {
                body: elseStatement.body,
            }

            ifStatement.cases.push(elseCase)
            ifStatement.tokens = tokens

            return ifStatement
        },
        config: { statement: true },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('아니면') }),
            j.instance(Identifier).field({ value: j.literal('만약') }),
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('이면') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const condition = nodes[2]
            const body = nodes[5]

            return new ElseIfStatement({ condition, body }, tokens)
        },
        config: {
            statement: {
                name: '아니면 만약',
                group: CompletionGroup.FLOW,
                visibility: { after: IfStatement },
            },
        },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('아니면') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const body = nodes[2]

            return new ElseStatement(body, tokens)
        },
        config: {
            statement: {
                name: '아니면',
                group: CompletionGroup.FLOW,
                visibility: { after: IfStatement },
            },
        },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('만약') }),
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('이면') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const condition = nodes[1]
            const body = nodes[4]

            return new IfStatement([{ condition, body }], tokens)
        },
        config: {
            statement: {
                name: '만약',
                group: CompletionGroup.FLOW,
                visibility: 'always',
            },
        },
    },
    {
        pattern: [
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('의') }),
            j.instance(Identifier).field({ value: j.literal('값') }),
            j.instance(Identifier).field({ value: j.literal('종류') }),
        ],
        factory: (nodes, tokens) => {
            const value = nodes[0]
            return new TypeOf(value, tokens)
        },
    },
    ...createTypeCastRules(),
    {
        pattern: [
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('보여주기') }),
        ],
        factory: (nodes, tokens) => {
            const value = nodes[0]
            return new Print(value, tokens)
        },
        config: {
            statement: {
                name: '보여주기',
                group: CompletionGroup.OUTPUT,
                visibility: 'always',
            },
        },
    },
    {
        pattern: [
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('반환하기') }),
        ],
        factory: (nodes, tokens) => {
            const value = nodes[0]
            return new ReturnStatement(tokens, value)
        },
        config: {
            statement: {
                name: '값 돌려주기',
                group: CompletionGroup.FUNCTION,
                visibility: { inside: NodeCapability.RETURN },
            },
        },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('반환하기') }),
        ],
        factory: (_nodes, tokens) => {
            return new ReturnStatement(tokens)
        },
        config: {
            statement: {
                name: '약속 끝내기',
                group: CompletionGroup.FUNCTION,
                visibility: { inside: NodeCapability.RETURN },
            },
        },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('약속') }),
            j.instance(Identifier).field({ value: j.literal('그만') }),
        ],
        factory: (_nodes, tokens) => {
            return new ReturnStatement(tokens)
        },
        config: { statement: true },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('반복') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => new Loop(nodes[2], tokens),
        config: {
            statement: {
                name: '계속 반복하기',
                group: CompletionGroup.LOOP,
                visibility: 'always',
            },
        },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('반복하기') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => new Loop(nodes[2], tokens),
        config: { statement: true },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('반복') }),
            j.instance(Identifier).field({ value: j.literal('그만') }),
        ],
        factory: (_nodes, tokens) => new Break(tokens),
        config: {
            statement: {
                name: '반복 멈추기',
                group: CompletionGroup.LOOP,
                visibility: { inside: NodeCapability.LOOP_CONTROL },
            },
        },
    },
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('다음') }),
            j.instance(Identifier).field({ value: j.literal('반복') }),
        ],
        factory: (_nodes, tokens) => new Continue(tokens),
        config: {
            statement: {
                name: '다음 것으로 넘어가기',
                group: CompletionGroup.LOOP,
                visibility: { inside: NodeCapability.LOOP_CONTROL },
            },
        },
    },
    ...LIST_LOOP_RULES,
    ...COUNT_LOOP_RULES,
    {
        pattern: [
            j.instance(Identifier).field({ value: j.literal('반복') }),
            j.instance(Evaluable),
            j.instance(Identifier).field({ value: j.literal('동안') }),
            j.instance(EOL),
            j.instance(Block),
        ],
        factory: (nodes, tokens) => {
            const condition = nodes[1]
            const body = nodes[4]
            return new ConditionalLoop(condition, body, tokens)
        },
        config: {
            statement: {
                name: '맞는 동안 반복하기',
                group: CompletionGroup.LOOP,
                visibility: 'always',
            },
        },
    },
    {
        pattern: [
            j.instance(Expression).field({ value: j.literal('[') }),
            j.instance(Evaluable),
            j.instance(Expression).field({ value: j.literal(']') }),
        ],
        factory: (nodes, tokens) => {
            const item = nodes[1]
            return new ListLiteral([item], nodes[2], tokens)
        },
    },
    ...DICT_RULES,
]

function createTypeCastRules(): Rule[] {
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

    const rules: Rule[] = []

    for (const particle of particles) {
        for (const { keywords, target, split } of targetTypes) {
            for (const keyword of keywords) {
                rules.push({
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
                })
            }

            if (split) {
                for (const [head, tail] of split) {
                    rules.push({
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
                    })
                }
            }
        }
    }

    return rules
}
