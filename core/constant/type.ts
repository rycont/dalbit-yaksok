import type {
    SRRule,
    Token,
    Statement,
    LineFetcher,
    Evaluable,
    Scope,
    Block,
} from '@dalbit-yaksok/core'

export type Brand<K, T> = K & { __brand: T }

export interface TokenLine {
    level: number
    validTokens: Token[]
    rawRange: [number, number]
}

export interface FactoryParsers {
    statement: (lines: TokenLine[]) => Block
    value: (tokens: Token[]) => Evaluable
}

export interface RDRule {
    name: string
    description?: string
    factory(
        next: LineFetcher<true>,
        parse: FactoryParsers,
        scope: Scope,
    ): FactoryResult | null
}

export interface FactoryResult {
    instance: Statement
    consumed: LineFetcher
    scope?: Scope
}

export interface RuleList {
    sr: SRRule[]
    rd: RDRule[]
}
