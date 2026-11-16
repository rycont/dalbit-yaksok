import type {
    SRRule,
    Token,
    Block,
    Evaluable,
    Statement,
} from '@dalbit-yaksok/core'

export type Brand<K, T> = K & { __brand: T }

export interface TokenLine {
    level: number
    validTokens: Token[]
    rawTokens: Token[]
    validRange: [number, number]
}

export interface NodeFactoryAction {
    getFollowingBlockTokens: () => {
        look: Token[]
        consume: () => Token[]
    }
    parseFollowingBlock: (localRules?: RuleList) => {
        look: Block
        consume: () => Block
    }
    parse: (tokens: Token[]) => Evaluable
    nextLines: (count: number) => {
        look: TokenLine[]
        consume: () => TokenLine[]
    }
}

export interface RDRule {
    name: string
    description?: string
    factory(
        line: TokenLine,
        actions: NodeFactoryAction,
    ): {
        instance: Statement
        rule?: RuleList
    } | null
}

export interface RuleList {
    sr: SRRule[]
    rd: RDRule[]
}
