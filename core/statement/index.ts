import { Scope, ScopeChain, Token, YaksokError } from '@dalbit-yaksok/core'

export interface Statement {
    scope: Scope

    validate(): YaksokError[]
    execute(scopeChain: ScopeChain): Promise<void>

    tokens: Token[]
    parsingErrors: YaksokError[]
}
