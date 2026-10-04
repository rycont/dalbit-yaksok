import {
    AmbiguousFormulaBoundary,
    CannotUnderstandError,
    NotDefinedIdentifierError,
    TOKEN_TYPE,
} from '@dalbit-yaksok/core'

import { Processor } from './type.ts'
import { blue, bold } from '../../util/terminal.ts'
import { j } from '@dalbit-yaksok/pattern'
import { YaksokError } from '../index.ts'

const statementFormPattern = j
    .list([
        j.instance(NotDefinedIdentifierError).field({
            resource: j.field({
                name: j.literal('만약'),
            }),
            tokens: j.exist().select('openTokens'),
        }),
        j.instance(NotDefinedIdentifierError).field({
            resource: j.field({
                name: j.literal('이면'),
            }),
            tokens: j.exist().select('closeTokens'),
        }),
    ])
    .compile()

const conditionPattern = j
    .type<YaksokError[]>()
    .list([
        j.instance(NotDefinedIdentifierError).field({
            resource: j.field({
                name: j.literal('만약'),
            }),
            tokens: j.exist().select('openTokens'),
        }),
        j.space().select('condition'),
        j.instance(NotDefinedIdentifierError).field({
            resource: j.field({
                name: j.literal('이면'),
            }),
            tokens: j.exist().select('closeTokens'),
        }),
    ])
    .compile()

export const prettifyBrokenIf: Processor = (errors, tokens) => {
    const 만약이면PatternTest = statementFormPattern.func(
        statementFormPattern.id,
        errors,
    )
    if (만약이면PatternTest) {
        const firstTokenIndex = tokens.indexOf(
            만약이면PatternTest.openTokens[0],
        )
        const lastTokenIndex = tokens.indexOf(
            만약이면PatternTest.closeTokens[
                만약이면PatternTest.closeTokens.length - 1
            ],
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
                        additionalMessage: `${blue(bold('만약'))}의 다음 줄에 네 칸을 띄고 실행할 코드를 작성 해주세요.`,
                    },
                }),
            ]
        }

        return [
            new CannotUnderstandError({
                tokens: statementTokens,
                resource: {
                    additionalMessage: `다음 줄에 적은 코드를 언제 실행할 지 ${blue(bold('만약'))}과 ${blue(bold('이면'))} 사이에 적어주세요.`,
                },
            }),
        ]
    }

    const conditionErrors = match(errors)
        .with([,], ({ openTokens, closeTokens, condition }) => {
            const boundaryCondition = condition.find(
                (e) => e instanceof AmbiguousFormulaBoundary,
            )
            if (boundaryCondition) {
                return [boundaryCondition]
            }

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
                }),
            ]
        })
        .otherwise(() => errors)

    return conditionErrors
}
