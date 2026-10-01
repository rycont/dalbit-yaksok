import { Node, NodeCapability, Token } from '@dalbit-yaksok/core'
import { ClassType, Chain, Matcher } from '@dalbit-yaksok/pattern'

// type NodeType = new (...args: any[]) => Node

type PatternUnit<Shape extends Node> = Matcher<
    unknown,
    {
        classShape: Shape
        isSuffix?: boolean
    }
>

type PatternUnitChain<Shape extends Node> = Chain<
    unknown,
    unknown,
    {
        classShape: Shape
        isSuffix?: boolean
    }
>

export interface DirectReplacer {
    tokenRange: [number, number]
    nodes: Node[]
}

interface Rule<NodeSequence extends Node[]> {
    pattern: {
        [K in keyof NodeSequence]: PatternUnit<NodeSequence[K]>
    }
    factory: (
        nodes: {
            [K in keyof NodeSequence]: NodeSequence[K]
        },
        tokens: Token[],
    ) => Node | null
    isStatement?: boolean
}

export function r<NodeSequence extends Node[] = Node[]>(
    props: Omit<Rule<NodeSequence>, 'pattern'> & {
        pattern: {
            [K in keyof NodeSequence]: PatternUnitChain<NodeSequence[K]>
        }
    },
): Rule<NodeSequence> {
    const compiled = props.pattern.map((p) =>
        p.compile(),
    ) as Rule<NodeSequence>['pattern']

    return {
        factory: props.factory,
        isStatement: props.isStatement,
        pattern: compiled,
    }
}

export interface DynamicRules {
    rules: Rule[]
    replacers: DirectReplacer[]
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
    | { after: ClassType }
    | { inside: NodeCapability }

export interface SuggestableStatement {
    name: string
    group: CompletionGroup
    visibility: StatementVisibility
}
