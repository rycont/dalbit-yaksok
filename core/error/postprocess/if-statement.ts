import { match, P } from 'ts-pattern'
import {
    CannotUnderstandError,
    IfStatement,
    NotDefinedIdentifierError,
    TOKEN_TYPE,
} from '@dalbit-yaksok/core'
import { Processor } from './type.ts'
import { blue, bold } from '../../util/terminal.ts'

export const prettifyBrokenIf: Processor = (errors, tokens) => {
    const conditionErrors = match(errors)
        .with(
            [
                P.instanceOf(NotDefinedIdentifierError).and({
                    resource: {
                        name: '만약',
                    },
                    tokens: P.nonNullable.and(P.select('openTokens')),
                }),
                P.instanceOf(NotDefinedIdentifierError).and({
                    resource: {
                        name: '이면',
                    },
                    tokens: P.nonNullable.and(P.select('closeTokens')),
                }),
            ],
            ({ openTokens, closeTokens }) => {
                const firstTokenIndex = tokens.indexOf(openTokens[0])
                const lastTokenIndex = tokens.indexOf(
                    closeTokens[closeTokens.length - 1],
                )

                const conditionTokens = tokens.slice(
                    firstTokenIndex + 1,
                    lastTokenIndex,
                )

                const hasValidTokens = conditionTokens.some(
                    (token) => token.type !== TOKEN_TYPE.SPACE,
                )

                const statementTokens = tokens.slice(
                    firstTokenIndex,
                    lastTokenIndex + 1,
                )

                if (hasValidTokens) {
                    return [
                        new CannotUnderstandError({
                            tokens: conditionTokens,
                            resource: {
                                nodeType: IfStatement,
                                additionalMessage: `${blue(bold('만약'))}의 다음 줄에 네 칸을 띄고 실행할 코드를 작성 해주세요.`,
                            },
                        }),
                    ]
                }

                return [
                    new CannotUnderstandError({
                        tokens: statementTokens,
                        resource: {
                            nodeType: IfStatement,
                            additionalMessage: `다음 줄에 적은 코드를 언제 실행할 지 ${blue(bold('만약'))}과 ${blue(bold('이면'))} 사이에 적어주세요.`,
                        },
                    }),
                ]
            },
        )
        .with(
            [
                P.instanceOf(NotDefinedIdentifierError).and({
                    resource: {
                        name: '만약',
                    },
                    tokens: P.nonNullable.and(P.select('openTokens')),
                }),
                ...P.array(),
                P.instanceOf(NotDefinedIdentifierError).and({
                    resource: {
                        name: '이면',
                    },
                    tokens: P.nonNullable.and(P.select('closeTokens')),
                }),
            ],
            ({ openTokens, closeTokens }) => {
                const firstTokenIndex =
                    tokens.indexOf(openTokens[openTokens.length - 1]) + 1
                const lastTokenIndex = tokens.indexOf(closeTokens[0]) - 1

                const errorRangeTokens = tokens.slice(
                    firstTokenIndex,
                    lastTokenIndex + 1,
                )

                return [
                    new CannotUnderstandError({
                        tokens: errorRangeTokens,
                        resource: { nodeType: IfStatement },
                    }),
                ]
            },
        )
        .otherwise(() => errors)

    return conditionErrors
}
