import {
    NotDefinedIdentifierError,
    TOKEN_TYPE,
    YaksokError,
} from '@dalbit-yaksok/core'
import { Processor } from './type.ts'

export const mergeSequentialIdentifiers: Processor = (errors, tokens) => {
    const identifierGroups: {
        startToken: number
        endToken: number
        startError: number
        endError: number
        errors: YaksokError[]
    }[] = []

    for (let i = 0; i < errors.length; i++) {
        const current = errors[i]

        if (!(current instanceof NotDefinedIdentifierError)) {
            continue
        }

        const currentStartToken = tokens.indexOf(current.tokens![0])
        const currentEndToken = tokens.indexOf(
            current.tokens![current.tokens!.length - 1],
        )

        if (identifierGroups.length === 0) {
            identifierGroups.push({
                startToken: currentStartToken,
                endToken: currentEndToken,
                startError: i,
                endError: i,
                errors: [current],
            })
            continue
        }

        const lastGroup = identifierGroups[identifierGroups.length - 1]
        const lastEndToken = lastGroup.endToken

        const isEmptyBetween = tokens
            .slice(lastEndToken + 1, currentStartToken)
            .every((token) => token.type === TOKEN_TYPE.SPACE)

        if (isEmptyBetween) {
            lastGroup.endToken = currentEndToken
            lastGroup.endError = i
            lastGroup.errors.push(current)
            continue
        }

        identifierGroups.push({
            startToken: currentStartToken,
            endToken: currentEndToken,
            startError: i,
            endError: i,
            errors: [current],
        })
    }

    const newErrors: (YaksokError | null)[] = Array.from(errors)

    for (const group of identifierGroups) {
        const sequentialTokens = tokens.slice(
            group.startToken,
            group.endToken + 1,
        )
        const sequentialErrors = sequentialTokens
            .map((token) => token.value)
            .join('')
            .trim()

        newErrors.fill(null, group.startError, group.endError + 1)
        newErrors[group.startError] = new NotDefinedIdentifierError({
            resource: {
                name: sequentialErrors,
            },
            scope: group.errors[0].scope!,
            tokens: sequentialTokens,
        })
    }

    return newErrors.filter((error): error is YaksokError => error !== null)
}
