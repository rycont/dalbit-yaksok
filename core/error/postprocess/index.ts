import { Token, YaksokError } from '@dalbit-yaksok/core'
import { prettifyBrokenIf } from './if-statement.ts'

const PROCESSORS = [prettifyBrokenIf]

export function postprocessErrors(allErrors: YaksokError[], tokens: Token[]) {
    const errorsByInformationStatus = Object.groupBy(allErrors, (e) =>
        e.tokens?.length === 1 && e.scope ? 'full' : 'partial',
    )

    const errors = errorsByInformationStatus.full || []

    const errorGroups = Object.values(
        Object.groupBy(errors, (e) => e.tokens![0].position.line + e.scope!.id),
    ) as YaksokError[][]

    return errorGroups.flatMap((group) => {
        return PROCESSORS.reduce((acc, processor) => {
            return processor(acc, tokens)
        }, group)
    })
}
