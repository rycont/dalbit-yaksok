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

    const signatures = lineTokens.flatMap((line) =>
        match(line)
            .returnType<
                (Omit<Omit<FunctionDeclareRange, 'start'>, 'end'> & {
                    header: Token[]
                })[]
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
                    ...P.array().select(),
                ],
                (header) => [
                    {
                        type: FunctionType.약속,
                        header,
                    },
                ],
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
                    ...P.array().select('header'),
                ],
                ({ runtime, header }) => [
                    {
                        type: FunctionType.번역,
                        header,
                        runtime,
                    },
                ],
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
                    ...P.array().select('header'),
                ],
                ({ id, header }) => [
                    {
                        type: FunctionType.이벤트,
                        header,
                        id,
                    },
                ],
            )
            .otherwise(() => []),
    )

    return signatures.map(
        (s) =>
            ({
                ...s,
                start: tokens.indexOf(s.header[0]),
                end: tokens.indexOf(s.header[s.header.length - 1]),
            }) as FunctionDeclareRange,
    )
}
