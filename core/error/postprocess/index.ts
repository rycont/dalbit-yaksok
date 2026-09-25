import { Token, YaksokError } from '@dalbit-yaksok/core'
import { prettifyBrokenIf } from './if-statement.ts'

const PROCESSORS = [prettifyBrokenIf]

export function postprocessErrors(errors: YaksokError[], tokens: Token[]) {
    const insufficientError = errors.find(
        (e) => e.tokens?.length === 0 || !e.scope,
    )
    if (insufficientError) {
        console.error(insufficientError)
        throw new Error('scope is required')
    }

    const errorGroups = Object.values(
        Object.groupBy(errors, (e) => e.tokens![0].position.line + e.scope!.id),
    ) as YaksokError[][]

    return errorGroups.flatMap((group) => {
        return PROCESSORS.reduce((acc, processor) => {
            return processor(acc, tokens)
        }, group)
    })
}
