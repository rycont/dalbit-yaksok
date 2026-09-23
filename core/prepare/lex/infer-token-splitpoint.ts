import * as v from 'valibot'

import {
    Brand,
    NotDefinedIdentifierError,
    PatternUnit,
    Rule,
    Scope,
} from '@dalbit-yaksok/core'

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

        const inferredSplitpointByLine = inferSplitpointByLine(errors, scope)
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
                p.prefix.length -
                1) as Splitpoint,
    )

    return splitpoints
}

function inferSplitpointByLine(
    errors: NotDefinedIdentifierError[],
    scope: Scope,
) {
    const scopeNames = scope.getAccessibleNames().toArray()
    const scopePatterns = scope.getExportedRules()

    const patternsWithOptions = scopePatterns
        .map((rule) => ({
            rule,
            options: rule.pattern.flatMap((u) => inferNameGroup(u)),
        }))
        .filter((p) => p.options.length)
        .toArray()

    const patternPostfixes = Object.groupBy(
        patternsWithOptions.flatMap((p) =>
            p.options.flatMap((suffixes) =>
                suffixes.map((suffix) => ({
                    suffix,
                    rule: p.rule,
                })),
            ),
        ),
        (v) => v.suffix,
    )

    const inferredPrefixes = errors
        .map((error) => {
            const missingName = error.resource.name

            return {
                missingName,
                token: error.tokens![0],
                candidates: scopeNames
                    .filter((s) => missingName.startsWith(s))
                    .map((prefix) => ({
                        prefix,
                        suffix: missingName.slice(prefix.length),
                    }))
                    .filter((candidate) => candidate.suffix in patternPostfixes)
                    .map((candidate) => ({
                        ...candidate,
                        rules: patternPostfixes[candidate.suffix]?.map(
                            (g) => g.rule,
                        ),
                    }))
                    .filter((candidate) => candidate.rules?.length),
            }
        })
        .filter((inferredPrefix) => inferredPrefix.candidates.length)

    if (inferredPrefixes.length === 0) {
        return []
    }

    const intersectingRules = Array.from(
        intersectAll<Rule>(
            inferredPrefixes.map(
                (inferredPrefix) =>
                    new Set<Rule>(
                        inferredPrefix.candidates.flatMap(
                            (candidate) => candidate.rules!,
                        ),
                    ),
            ),
        ),
    )

    const inferredPrefixesInSharedRules = intersectingRules.flatMap((rule) =>
        inferredPrefixes.flatMap((prefix) =>
            prefix.candidates
                .filter((candidate) => candidate.rules?.includes(rule))
                .map((candidate) => ({
                    token: prefix.token,
                    prefix: candidate.prefix,
                })),
        ),
    )

    const inferredPrefixesByToken = Map.groupBy(
        inferredPrefixesInSharedRules,
        (i) => i.token,
    ).entries()

    const chosenPrefixes = inferredPrefixesByToken
        .map(([token, infer]) => {
            if (infer.length === 1) {
                return { token, prefix: infer[0].prefix }
            }

            const infersByPrefix = Map.groupBy(infer, (i) => i.prefix)

            if (infersByPrefix.size === 1) {
                return { token, prefix: infer[0].prefix }
            }

            const mostInfers = infersByPrefix
                .entries()
                .toArray()
                .toSorted((a, b) => a[1].length - b[1].length)[0][0]

            return { token, prefix: mostInfers }
        })
        .toArray()

    return chosenPrefixes
}

function inferNameGroup(patternUnit: PatternUnit): [string[]] | [] {
    if (v.getMetadata(patternUnit as v.GenericSchema).isSuffix) {
        return [
            (
                (
                    (
                        patternUnit as v.SchemaWithPipe<[v.GenericSchema]>
                    ).pipe.find((p) => p.type === 'object') as v.ObjectSchema<
                        Record<string, v.GenericSchema>,
                        undefined
                    >
                )?.entries?.value as v.PicklistSchema<[], undefined>
            )?.options,
        ]
    }

    return []
}

function intersectAll<T>(sets: Set<T>[]): Set<T> {
    if (!sets.length) {
        return new Set()
    }

    return sets.reduce((acc, currentSet) => acc.intersection(currentSet))
}
