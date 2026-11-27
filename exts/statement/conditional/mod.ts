import {
    EmptyEvaluable,
    Extension,
    FactoryParsers,
    LineFetcher,
    Token,
    TOKEN_TYPE,
    UnexpectedTokenError,
    YaksokError,
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
                factory(code, parse, scope) {
                    const [cases, errors, consumed] = buildCases(
                        code,
                        parse,
                        true,
                    )

                    if (cases.length === 0) {
                        return null
                    }

                    const instance = new IfStatement(
                        scope,
                        cases,
                        code.look.validTokens,
                    )

                    instance.parsingErrors =
                        instance.parsingErrors.concat(errors)

                    return {
                        instance,
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
): [Case[], YaksokError[], LineFetcher] {
    const [conditionalCase, errors, consumed] = tokensToCase(
        isFirstLine,
        code,
        parse,
    )

    if (!conditionalCase) {
        return [[], errors, consumed]
    }

    const [followingCases, followingErrors, followingConsumed] = buildCases(
        consumed,
        parse,
    )

    return [
        [conditionalCase].concat(followingCases),
        errors.concat(followingErrors),
        followingConsumed,
    ]
}

function tokensToCase(
    isFirstLine: boolean,
    code: LineFetcher,
    parse: FactoryParsers,
): [Case | null, YaksokError[], LineFetcher] {
    if (!code.consume) {
        return [null, [], code]
    }

    const [line, consumed] = code.consume()

    if (!line) {
        return [null, [], code]
    }

    const test = isFirstLine
        ? ifPattern.func(ifPattern.id, line.validTokens) ||
          elseIfPattern.func(elseIfPattern.id, line.validTokens) ||
          elsePattern.func(elsePattern.id, line.validTokens)
        : elseIfPattern.func(elseIfPattern.id, line.validTokens) ||
          elsePattern.func(elsePattern.id, line.validTokens)

    if (!test) {
        return [null, [], code]
    }

    const condition = test.condition ? parse.value(test.condition) : null

    if (condition instanceof EmptyEvaluable) {
        condition.assist = `다음 줄에 적힌 코드를 언제 실행해야 하는지 '만약'과 '이면' 사이에 적어주세요.`
        condition.tokens = line.validTokens
        condition.part = '만약의 조건문이'
    }

    const [bodyTokens, bodyConsumed] = consumed.block.consume()

    const body = parse.statement(bodyTokens)

    if (body.statements.length === 0) {
        body.tokens = line.validTokens
    }

    return [
        {
            condition,
            body,
        },
        isFirstLine && condition === null
            ? [
                  new UnexpectedTokenError({
                      resource: {
                          parts: '조건문 시작',
                          message: `조건문은 '만약'으로 시작해야 해요.`,
                      },
                      tokens: line.validTokens,
                  }),
              ]
            : [],
        bodyConsumed,
    ]
}

export default extension
