import { Token, YaksokError } from '@dalbit-yaksok/core'
import { prettifyBrokenIf } from './if-statement.ts'
import { prettifyVariableDeclaration } from './variable.ts'
import { prettifyBrokenList } from './list.ts'
import { mergeSequentialIdentifiers } from './identifier.ts'
import { Processor } from './type.ts'

const PROCESSORS: Processor[] = [
    mergeSequentialIdentifiers,
    prettifyBrokenIf,
    prettifyVariableDeclaration,
    prettifyBrokenList,
]

export function postprocessErrors(errors: YaksokError[], tokens: Token[]) {
    const insufficientError = errors.find(
        (e) => e.tokens?.length === 0 || !e.scope,
    )
    if (insufficientError) {
        console.error(insufficientError)
        throw new Error('scope is required')
    }

    const sortedErrors = errors.sort((a, b) => {
        return tokens.indexOf(a.tokens![0]) - tokens.indexOf(b.tokens![0])
    })

    const errorGroups = Object.values(
        Object.groupBy(
            sortedErrors,
            (e) => e.tokens![0].position.line + e.scope!.id,
        ),
    ) as YaksokError[][]

    return errorGroups.flatMap((group) => {
        const line = group[0].tokens![0].position.line!

        const lineTokenStartIndex = tokens.findIndex(
            (t) => line === t.position.line,
        )

        const lineTokenEndIndex = tokens.findLastIndex(
            (t) => line === t.position.line,
        )

        const lineTokens = tokens.slice(
            lineTokenStartIndex,
            lineTokenEndIndex + 1,
        )

        return PROCESSORS.reduce((acc, processor) => {
            return processor(acc, lineTokens)
        }, group)
    })
}
