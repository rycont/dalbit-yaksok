import { Scope, Token, YaksokError } from '@dalbit-yaksok/core'

export interface Statement {
    validate(scope: Scope): YaksokError[]
    execute(scope: Scope): Promise<void>

    tokens: Token[]
    parsingErrors: YaksokError[]
}
