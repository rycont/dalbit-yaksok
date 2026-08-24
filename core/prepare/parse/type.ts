import type { Node, NodeCapability } from '../../node/base.ts'
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
    factory: (nodes: Node[], tokens: Token[]) => Node | null
    config?: Record<string, unknown> & {
        statement?: SuggestableStatement | true
    }
    flags?: RULE_FLAGS[]
}

export enum RULE_FLAGS {
    DEBUG,
    IS_FUNCTION_INVOKE,
}

export enum CompletionGroup {
    FLOW = 'FLOW',
    LOOP = 'LOOP',
    DATA = 'DATA',
    OUTPUT = 'OUTPUT',
    FUNCTION = 'FUNCTION',
}

// `after` 와 `inside` 는 아직 아무도 읽지 않습니다
export type StatementVisibility =
    | 'always'
    | { after: PatternUnit['type'] }
    | { inside: NodeCapability }

export interface SuggestableStatement {
    name: string
    group: CompletionGroup
    visibility: StatementVisibility
}
