import {
    Extension,
    FactoryParsers,
    LineFetcher,
    Token,
    TOKEN_TYPE,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'
import { Case, IfStatement } from './node'

const ifPattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('만약'),
        }),
        j.type<Token>().space().select('condition'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('이면'),
        }),
    ])
    .compile()

const elseIfPattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('아니면'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('만약'),
        }),
        j.type<Token>().space().select('condition'),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('이면'),
        }),
    ])
    .compile()

const elsePattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('아니면'),
        }),
    ])
    .injectSelect({
        condition: null,
    })
    .compile()

const extension: Extension = {
    capabilties: {
        Grammer: [
            {
                name: '조건문',
                description: '조건이 맞을 때만 실행해요',
                factory(code, parse) {
                    const [cases, consumed] = buildCases(code, parse, true)

                    if (cases.length === 0) {
                        return null
                    }

                    return {
                        instance: new IfStatement(cases, code.look.validTokens),
                        consumed,
                    }
                },
            },
        ],
    },
}

function buildCases(
    code: LineFetcher,
    parse: FactoryParsers,
    isFirstLine: boolean = false,
): [Case[], LineFetcher] {
    const [conditionalCase, consumed] = tokensToCase(isFirstLine, code, parse)

    if (!conditionalCase) {
        return [[], consumed]
    }

    const [followingCases, followingConsumed] = buildCases(consumed, parse)

    return [[conditionalCase].concat(followingCases), followingConsumed]
}

function tokensToCase(
    isFirstLine: boolean,
    code: LineFetcher,
    parse: FactoryParsers,
): [Case | null, LineFetcher] {
    const [line, consumed] = code.consume()

    if (!line) {
        return [null, consumed]
    }

    const test = isFirstLine
        ? ifPattern.func(ifPattern.id, line.validTokens)
        : elseIfPattern.func(elseIfPattern.id, line.validTokens) ||
          elsePattern.func(elsePattern.id, line.validTokens)

    if (!test || !consumed.block) {
        return [null, consumed]
    }

    const [bodyTokens, bodyConsumed] = consumed.block.consume()

    const condition = test.condition ? parse.value(test.condition) : null
    const body = parse.statement(bodyTokens)

    return [
        {
            condition,
            body,
        },
        bodyConsumed,
    ]
}

export default extension
