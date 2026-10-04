import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

import { FunctionDeclareRange, FunctionType } from './type.ts'

const yaksokPattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('약속'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.select('firstSignature'),
        j.space(),
    ])
    .compile()

const 번역Pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('번역'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
        }),
        j.field({
            value: j.select('runtime'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.CLOSING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.select('firstSignature'),
        j.space(),
    ])
    .compile()

const incomplete번역Pattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('번역'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
        }),
        j.space(),
    ])
    .compile()

const eventPattern = j
    .type<Token[]>()
    .list([
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.literal('이벤트'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.OPENING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.IDENTIFIER),
            value: j.select('id'),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.CLOSING_PARENTHESIS),
        }),
        j.field({
            type: j.literal(TOKEN_TYPE.COMMA),
        }),
        j.select('firstSignature'),
        j.space(),
    ])
    .compile()

function jMatch(line: Token[]) {
    const yaksokPatternTest = yaksokPattern.func(yaksokPattern.id, line)

    if (yaksokPatternTest) {
        return {
            type: FunctionType.약속,
            firstSignature: yaksokPatternTest.firstSignature,
        }
    }

    const 번역PatternTest = 번역Pattern.func(번역Pattern.id, line)

    if (번역PatternTest) {
        return {
            type: FunctionType.번역,
            firstSignature: 번역PatternTest.firstSignature,
            runtime: 번역PatternTest.runtime,
        }
    }

    const incomplete번역PatternTest = incomplete번역Pattern.func(
        incomplete번역Pattern.id,
        line,
    )

    if (incomplete번역PatternTest) {
        return {
            type: FunctionType.번역,
            firstSignature: null,
            runtime: null,
        }
    }

    const eventPatternTest = eventPattern.func(eventPattern.id, line)

    if (eventPatternTest) {
        return {
            type: FunctionType.이벤트,
            id: eventPatternTest.id,
            firstSignature: eventPatternTest.firstSignature,
        }
    }

    return null
}

export function getDeclareSignature(tokens: Token[]): FunctionDeclareRange[] {
    const linebreaks = [-1]
        .concat(
            tokens.flatMap((t, i) =>
                t.type === TOKEN_TYPE.NEW_LINE ? [i] : [],
            ),
        )
        .concat([tokens.length])

    const lineTokens = Array.from(
        { length: linebreaks.length - 1 },
        (_, index) =>
            tokens
                .slice(linebreaks[index] + 1, linebreaks[index + 1])
                .filter(
                    (t) =>
                        ![
                            TOKEN_TYPE.INDENT,
                            TOKEN_TYPE.LINE_COMMENT,
                            TOKEN_TYPE.SPACE,
                        ].includes(t.type),
                ),
    )

    const signatures: FunctionDeclareRange[] = lineTokens.flatMap(
        (line, index) => {
            const matched = jMatch(line)

            if (matched === null) {
                return []
            }

            const range = [
                {
                    ...matched,
                    line: {
                        start: linebreaks[index] + 1,
                        end: linebreaks[index + 1],
                    },
                    signature: {
                        start: matched.firstSignature
                            ? tokens.indexOf(matched.firstSignature)
                            : linebreaks[index + 1],
                        end: linebreaks[index + 1],
                    },
                } as FunctionDeclareRange,
            ]

            return range
        },
    )

    return signatures
}
