import {
    Brand,
    NotDefinedIdentifierError,
    PatternUnitWithValue,
} from '@dalbit-yaksok/core'
import { Token } from '../tokenize/token.ts'

export type Splitpoint = Brand<number, 'Splitpoint'>

export function inferTokenSplitpointsFromErrors(
    code: string,
    missingIdentifierErrors: NotDefinedIdentifierError[],
): Splitpoint[] {
    const errorsWithPosition = missingIdentifierErrors.filter(
        (e) => e.tokens?.length === 1 && e.scope,
    )

    const errorsByGroups = Object.values(
        Object.groupBy(
            errorsWithPosition,
            (e) => e.tokens![0].position.line + e.scope!.id,
        ),
    )

    const localSplitpoints = errorsByGroups.flatMap((errorGroup) => {
        const errors = errorGroup?.toSorted(
            (a, b) =>
                a.tokens![0].position.column - b.tokens![0].position.column,
        )

        if (!errors) {
            return []
        }

        const scope = errors[0].scope!

        const scopeNames = new Set(scope.getAccessibleNames())
        const scopeRules = scope
            .getDynamicRules()
            .map((r) => r.pattern)
            .filter((p) => p.some((u) => u.isSuffix))

        const inferredSplitpointByLine = inferSplitpointByLine(
            errors,
            scopeRules,
            scopeNames,
        )

        return inferredSplitpointByLine
    })

    const lines = code.split('\n').reduce(
        (acc, current) => {
            return acc.concat(acc[acc.length - 1] + current.length + 1)
        },
        [0, 0],
    )

    const splitpoints = localSplitpoints.map(
        (p) =>
            (lines[p.token.position.line] +
                p.token.position.column +
                p.token.value.length -
                p.suffixSize -
                1) as Splitpoint,
    )

    return splitpoints
}

function inferSplitpointByLine(
    errors: NotDefinedIdentifierError[],
    patterns: PatternUnitWithValue[][],
    scopeNames: Set<string>,
) {
    const patternSuffixes = Object.entries(
        Object.groupBy(
            patterns.flatMap((p) =>
                p.flatMap((u, unitIndex) =>
                    u.isSuffix && u.value
                        ? [
                              {
                                  suffix: u.value,
                                  unitIndex,
                                  pattern: p,
                              },
                          ]
                        : [],
                ),
            ),
            (p) => p.suffix,
        ),
    ).filter((p) => !!p)

    const matchedPatternsByError = errors
        .map((e) => ({
            token: e.tokens![0],
            suffixes: patternSuffixes
                .filter(([suffix]) => e.resource.name.endsWith(suffix))
                .flatMap(([suffix, patternUnit]) => ({
                    prefix: e.resource.name.slice(0, -suffix.length),
                    patternUnit,
                }))
                .filter(({ prefix }) => scopeNames.has(prefix)),
        }))
        .filter((e) => e.suffixes.length)

    const validMatches = matchedPatternsByError.flatMap((e) =>
        e.suffixes.flatMap((s) =>
            s.patternUnit?.map((u) => ({
                pattern: u.pattern,
                unitIndex: u.unitIndex,
                token: e.token,
            })),
        ),
    )

    const matchesByPattern = new Map<
        PatternUnitWithValue[],
        Map<Token, number>
    >()

    for (const match of validMatches) {
        if (!match) {
            continue
        }

        matchesByPattern
            .getOrInsert(match.pattern, new Map())
            .set(match.token, match.unitIndex)
    }

    const validPatterns = matchesByPattern
        .entries()
        .map(
            ([pattern, unitIndexMapByToken]) =>
                [pattern, unitIndexMapByToken.entries().toArray()] as const,
        )
        .filter(([_, unitIndexesByToken]) => {
            const isMappedUnitAcsending = unitIndexesByToken
                .map((e) => e[1])
                .every((v, i, a) => (a[i - 1] ?? -1) < v)

            const isTokenPositionAscensing = unitIndexesByToken
                .map((e) => e[0].position.column)
                .every((v, i, a) => (a[i - 1] ?? -1) < v)

            return isMappedUnitAcsending && isTokenPositionAscensing
        })

    const splitPlan = validPatterns
        .map(([pattern, indexMap]) =>
            indexMap.map(([token, unitIndex]) => ({
                token,
                suffixSize: pattern[unitIndex].value!.length,
            })),
        )
        .toArray()
        .toSorted((a, b) => b.length - a.length)[0]

    return splitPlan ?? []
}
