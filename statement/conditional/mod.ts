import {
    Extension,
    NodeFactoryAction,
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
                factory(line, action) {
                    const cases = buildCases(action, line.validTokens)

                    if (cases.length === 0) {
                        return null
                    }

                    return {
                        instance: new IfStatement(cases, line.validTokens),
                    }
                },
            },
        ],
    },
}

function buildCases(action: NodeFactoryAction, tokens?: Token[]): Case[] {
    if (tokens) {
        const conditionalCase = tokensToCase(
            {
                isFirstLine: true,
            },
            tokens,
            action,
        )

        if (!conditionalCase) {
            return []
        }

        return [conditionalCase].concat(buildCases(action))
    }

    const lineFetcher = action.nextLines(1)

    if (lineFetcher.look.length === 0) {
        return []
    }

    const conditionalCase = tokensToCase(
        {
            isFirstLine: false,
            consumer: () => lineFetcher.consume(),
        },
        lineFetcher.look[0].validTokens,
        action,
    )

    if (!conditionalCase) {
        return []
    }

    return [conditionalCase].concat(buildCases(action))
}

function tokensToCase(
    context: {
        isFirstLine: boolean
        consumer?: () => void
    },
    tokens: Token[],
    action: NodeFactoryAction,
): Case | null {
    const test = context.isFirstLine
        ? ifPattern.func(ifPattern.id, tokens)
        : elseIfPattern.func(elseIfPattern.id, tokens) ||
          elsePattern.func(elsePattern.id, tokens)

    if (!test) {
        return null
    }

    context.consumer?.()

    const condition = test.condition ? action.parse(test.condition) : null
    const body = action.parseFollowingBlock().consume()

    return {
        condition,
        body,
    }
}

export default extension
