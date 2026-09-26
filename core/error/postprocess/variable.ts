import { Processor } from './type.ts'
import {
    NotExecutableNodeError,
    NotProperIdentifierNameToDefineError,
    Token,
    TOKEN_TYPE,
    YaksokError,
} from '@dalbit-yaksok/core'

export const prettifyVariableDeclaration: Processor = (errors, tokens) => {
    const equalSignErrorIndex = errors.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.node?.value === '=',
    )

    if (equalSignErrorIndex === -1) {
        return errors
    }

    const nameErrors = prettifyNameErrors(errors, equalSignErrorIndex, tokens)
    const valueErrors = errors.slice(equalSignErrorIndex + 1)

    return nameErrors.concat(valueErrors)
}

function prettifyNameErrors(
    errors: YaksokError[],
    equalSignErrorIndex: number,
    tokens: Token[],
): YaksokError[] {
    const nameErrors = errors.slice(0, equalSignErrorIndex)

    const firstNameError = nameErrors[0]
    const lastNameError = nameErrors[nameErrors.length - 1]

    const nameTokenStartIndex = tokens.indexOf(firstNameError.tokens![0])
    const nameTokenEndIndex = tokens.indexOf(
        lastNameError.tokens![lastNameError.tokens!.length - 1],
    )

    const equalSignErrorNode = errors[equalSignErrorIndex].node

    const equalSignTokenStartIndex = tokens.indexOf(
        equalSignErrorNode!.tokens[0],
    )

    if (nameErrors.length !== 1) {
        return [
            new NotProperIdentifierNameToDefineError({
                scope: nameErrors[0].scope!,
                tokens: tokens.slice(0, equalSignTokenStartIndex),
            }),
        ]
    }

    const beforeTokens = tokens.slice(0, nameTokenStartIndex)

    const afterTokens = tokens.slice(
        nameTokenEndIndex + 1,
        equalSignTokenStartIndex,
    )

    const allTokenCovered = beforeTokens
        .concat(afterTokens)
        .every((e) => e.type === TOKEN_TYPE.SPACE)

    if (allTokenCovered) {
        return []
    }

    return [
        new NotProperIdentifierNameToDefineError({
            scope: nameErrors[0].scope!,
            tokens: tokens.slice(0, equalSignTokenStartIndex),
        }),
    ]
}
