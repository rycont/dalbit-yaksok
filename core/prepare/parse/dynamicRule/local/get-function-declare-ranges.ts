import { match, P } from 'ts-pattern'

import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'

import { FunctionDeclareRange, FunctionType } from './type.ts'

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
            const matched = match(line)
                .returnType<
                    | (Omit<FunctionDeclareRange, 'line' | 'signature'> & {
                          firstSignature: Token
                      })
                    | null
                >()
                .with(
                    [
                        {
                            type: TOKEN_TYPE.IDENTIFIER,
                            value: '약속',
                        },
                        {
                            type: TOKEN_TYPE.COMMA,
                        },
                        P._.select('firstSignature'),
                        ...P.array(),
                    ],
                    ({ firstSignature }) => ({
                        type: FunctionType.약속,
                        firstSignature,
                    }),
                )
                .with(
                    [
                        {
                            type: TOKEN_TYPE.IDENTIFIER,
                            value: '번역',
                        },
                        {
                            type: TOKEN_TYPE.OPENING_PARENTHESIS,
                        },
                        {
                            type: TOKEN_TYPE.IDENTIFIER,
                            value: P.string.select('runtime'),
                        },
                        {
                            type: TOKEN_TYPE.CLOSING_PARENTHESIS,
                        },
                        {
                            type: TOKEN_TYPE.COMMA,
                        },
                        P._.select('firstSignature'),
                        ...P.array(),
                    ],
                    ({ runtime, firstSignature }) => ({
                        type: FunctionType.번역,
                        firstSignature,
                        runtime,
                    }),
                )
                .with(
                    [
                        {
                            type: TOKEN_TYPE.IDENTIFIER,
                            value: '이벤트',
                        },
                        {
                            type: TOKEN_TYPE.OPENING_PARENTHESIS,
                        },
                        {
                            type: TOKEN_TYPE.IDENTIFIER,
                            value: P.string.select('id'),
                        },
                        {
                            type: TOKEN_TYPE.CLOSING_PARENTHESIS,
                        },
                        {
                            type: TOKEN_TYPE.COMMA,
                        },
                        P._.select('firstSignature'),
                        ...P.array(),
                    ],
                    ({ id, firstSignature }) => ({
                        type: FunctionType.이벤트,
                        id,
                        firstSignature,
                    }),
                )
                .otherwise(() => null)

            if (matched === null) {
                return []
            }

            const range = [
                {
                    ...matched,
                    line: {
                        start: linebreaks[index],
                        end: linebreaks[index + 1],
                    },
                    signature: {
                        start: tokens.indexOf(matched.firstSignature),
                        end: linebreaks[index + 1],
                    },
                } as FunctionDeclareRange,
            ]

            return range
        },
    )

    return signatures
}
