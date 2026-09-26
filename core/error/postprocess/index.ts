import { Token, YaksokError } from '@dalbit-yaksok/core'
import { prettifyBrokenIf } from './if-statement.ts'
import { prettifyVariableDeclaration } from './variable.ts'
import { prettifyBrokenList } from './list.ts'
import { mergeSequentialIdentifiers } from './identifier.ts'
import { Processor } from './type.ts'
import { prettifyIndentError } from './indent.ts'

const LINE_PROCESSORS: Processor[] = [
    prettifyBrokenIf,
    prettifyVariableDeclaration,
    prettifyBrokenList,
    mergeSequentialIdentifiers,
]

const GLOBAL_PROCESSORS: Processor[] = [prettifyIndentError]

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

    const globallyProcessed = GLOBAL_PROCESSORS.reduce((acc, processor) => {
        return processor(acc, tokens)
    }, sortedErrors)

    const errorGroups = Object.values(
        Object.groupBy(
            globallyProcessed,
            (e) => e.tokens![0].position.line + e.scope!.id,
        ),
    ) as YaksokError[][]

    const lineProcessed = errorGroups.flatMap((group) => {
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

        return LINE_PROCESSORS.reduce((acc, processor) => {
            return processor(acc, lineTokens)
        }, group)
    })

    return lineProcessed
}
