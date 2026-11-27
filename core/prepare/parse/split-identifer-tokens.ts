import { Scope, Token, TOKEN_TYPE } from '@dalbit-yaksok/core'

export function getIdentifierSplittedTokens(
    tokens: readonly Token[],
    scope: Scope,
): readonly Token[] {
    const identifierCandidates = new Set(
        tokens.filter((t) => t.type === TOKEN_TYPE.IDENTIFIER),
    )
        .values()
        .toArray()

    const staticPatterns = new Set(
        scope.getRuleListStack().flatMap((r) => r.sr),
    )
        .values()
        .flatMap((r) => r.pattern)
        .toArray()

    const suffixable = staticPatterns
        .filter((s) => s.meta.isSuffix)
        .flatMap((s) => s.meta.nameOptions || [])

    const signatureIdentifiers = new Set(
        staticPatterns.flatMap((p) => p.meta.nameOptions || []),
    )

    const unknownIdentifiers = identifierCandidates.filter(
        (v) =>
            scope.findSlot(v.value)[0] === null &&
            !signatureIdentifiers.has(v.value),
    )

    const recoveries = unknownIdentifiers
        .flatMap((v) => {
            const appliableSuffixes = suffixable.filter(
                (s) =>
                    v.value.endsWith(s) &&
                    scope.findSlot(v.value.slice(0, -s.length))[0],
            )

            if (appliableSuffixes.length) {
                return [
                    {
                        tokenIndex: tokens.indexOf(v),
                        suffixes: appliableSuffixes,
                    },
                ]
            }

            return []
        })
        .toSorted((a, b) => a.tokenIndex - b.tokenIndex)

    if (recoveries.length === 0) {
        return tokens
    }

    const splittedTokens = recoveries.flatMap((recovery, i) => {
        const splitting = tokens[recovery.tokenIndex]

        if (recovery.suffixes.length !== 1) {
            return []
        }

        const suffixSize = recovery.suffixes[0].length

        const splitted: Token[] = [
            {
                position: splitting.position,
                type: splitting.type,
                value: splitting.value.slice(0, -suffixSize),
            },
            {
                position: {
                    line: splitting.position.line,
                    column:
                        splitting.position.column +
                        splitting.value.length -
                        suffixSize,
                },
                type: splitting.type,
                value: recovery.suffixes[0],
            },
        ]

        const upcomingTokens = tokens.slice(
            recovery.tokenIndex + 1,
            recoveries[i + 1]?.tokenIndex ?? tokens.length,
        )

        return splitted.concat(upcomingTokens)
    })

    const leftPadded = tokens
        .slice(0, recoveries[0].tokenIndex)
        .concat(splittedTokens)

    return leftPadded
}
