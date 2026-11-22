import { RunFrame, Scope, Token, YaksokError } from '@dalbit-yaksok/core'

export interface Statement {
    scope: Scope

    validate(): YaksokError[]
    execute(runFrame: RunFrame): Promise<void>

    tokens: Token[]
    parsingErrors: YaksokError[]
}
