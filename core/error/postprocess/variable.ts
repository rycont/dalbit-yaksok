import { Processor } from './type.ts'
import {
    NotDefinedIdentifierError,
    NotExecutableNodeError,
    NotProperIdentifierNameToDefineError,
    YaksokError,
} from '@dalbit-yaksok/core'

export const prettifyVariableDeclaration: Processor = (errors, tokens) => {
    const equalSignError = errors.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.node?.value === '=',
    )

    if (equalSignError === -1) {
        return errors
    }

    let refinedErrors: YaksokError[] = []

    const nameErrors = errors.slice(0, equalSignError)

    if (nameErrors.length === 1) {
        if (!(nameErrors[0] instanceof NotDefinedIdentifierError)) {
            refinedErrors = refinedErrors.concat(nameErrors)
        }
    } else {
        const firstToken = nameErrors[0].tokens![0]
        const firstTokenIndex = tokens.indexOf(firstToken)

        const lastNameError = nameErrors[nameErrors.length - 1]
        const lastToken =
            lastNameError.tokens![lastNameError.tokens!.length - 1]
        const lastTokenIndex = tokens.indexOf(lastToken)

        const nameTokens = tokens.slice(firstTokenIndex, lastTokenIndex + 1)

        refinedErrors = refinedErrors.concat(
            new NotProperIdentifierNameToDefineError({
                tokens: nameTokens,
                scope: nameErrors[0].scope!,
            }),
        )
    }

    const valueErrors = errors.slice(equalSignError + 1)
    refinedErrors = refinedErrors.concat(valueErrors)

    return refinedErrors
}
