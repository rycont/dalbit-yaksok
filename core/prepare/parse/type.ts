import { Node, NodeCapability, Token } from '@dalbit-yaksok/core'
import { ClassType, Chain, Matcher } from '@dalbit-yaksok/pattern'

export type PatternUnit<Shape extends Node> = Matcher<
    unknown,
    {
        classShape: new () => Shape
    } & (
        | undefined
        | {
              isSuffix: boolean
              nameOptions: string[]
          }
    )
>

export type PatternUnitChain<Shape extends Node> = Chain<
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

export interface Rule<NodeSequence extends Node[] = Node[]> {
    pattern: {
        [K in keyof NodeSequence]: PatternUnit<NodeSequence[K]>
    }
    factory: (
        nodes: {
            [K in keyof NodeSequence]: NodeSequence[K]
        },
        tokens: Token[],
        rule: Rule<NodeSequence>,
    ) => Node | null
    isStatement?: boolean
}

export function r<NodeSequence extends Node[] = Node[]>(
    props: Omit<Rule<NodeSequence>, 'pattern'> & {
        pattern: {
            [K in keyof NodeSequence]:
                | PatternUnitChain<NodeSequence[K]>
                | PatternUnit<NodeSequence[K]>
        }
    },
): Rule<Node[]> {
    const compiled = props.pattern.map((p) =>
        'compile' in p ? p.compile() : p,
    )

    return {
        factory: props.factory,
        isStatement: props.isStatement,
        pattern: compiled,
    } as unknown as Rule
}

export interface DynamicRules {
    rules: Rule<Node[]>[]
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
