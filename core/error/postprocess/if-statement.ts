import { match, P } from 'ts-pattern'
import {
    CannotUnderstandError,
    IfStatement,
    NotDefinedIdentifierError,
} from '@dalbit-yaksok/core'
import { Processor } from './type.ts'

export const prettifyBrokenIf: Processor = (errors, tokens) => {
    return match(errors)
        .with(
            [
                P.instanceOf(NotDefinedIdentifierError).and({
                    resource: {
                        name: '만약',
                    },
                }),
                ...P.array().select(),
                P.instanceOf(NotDefinedIdentifierError).and({
                    resource: {
                        name: '이면',
                    },
                }),
            ],
            (content) => {
                const firstError = content[0]
                const lastError = content[content.length - 1]

                const firstToken = firstError.tokens![0]
                const lastToken =
                    lastError.tokens![lastError.tokens!.length - 1]

                const firstTokenIndex = tokens.indexOf(firstToken)
                const lastTokenIndex = tokens.indexOf(lastToken)

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
}
