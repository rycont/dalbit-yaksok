import type { Node } from '../../node/base.ts'
import type { Token } from '../tokenize/token.ts'

export interface PatternUnit {
    type: {
        new (...args: any[]): Node
    }
    value?: string
    as?: string
}

export type Rule = {
    pattern: PatternUnit[]
    factory: (nodes: Node[], tokens: Token[]) => Node
    config?: Record<string, unknown>
    flags?: RULE_FLAGS[]
}

export enum RULE_FLAGS {
    IS_STATEMENT,
    DEBUG,
}
