import type { Rule, Token, Node, Block, Evaluable } from '@dalbit-yaksok/core'

export type Brand<K, T> = K & { __brand: T }

export interface TokenLine {
    level: number
    validTokens: Token[]
    rawTokens: Token[]
    validRange: [number, number]
}

export interface TokenRule {
    name: string
    description: string
    factory(
        line: TokenLine,
        actions: {
            parseFollowingBlock: (localRules?: Rule[]) => {
                look: Block
                consume: () => Block
            }
            parse: (tokens: Token[]) => Evaluable
            nextLines: (count: number) => {
                look: TokenLine[]
                consume: () => TokenLine[]
            }
        },
    ): {
        instance: Node
        rules?: Rule[]
    } | null
}
