import type { Rule, Token, Node, Block } from '@dalbit-yaksok/core'

export type Brand<K, T> = K & { __brand: T }

export interface TokenLine {
    level: number
    validTokens: Token[]
    rawTokens: Token[]
    range: [number, number]
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
            nextLine: (offset: number) => {
                look: TokenLine
                consume: () => TokenLine
            }
        },
    ): {
        instance: Node
        rules?: Rule[]
    } | null
}
