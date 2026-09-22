import * as v from 'valibot'
import type { GenericSchema, InstanceSchema, IntersectSchema } from 'valibot'

import { Node, NodeCapability, Token } from '@dalbit-yaksok/core'

export type NodeType = new (...args: any[]) => Node

type PatternUnitWithValue<T extends NodeType | unknown = unknown> = {
    type: T
    value?: string
    isSuffix?: boolean
}

type InstanceIntersect<T extends NodeType> = IntersectSchema<
    [InstanceSchema<T, undefined>, GenericSchema],
    undefined
>

export function instancePipe(
    classType: NodeType,
    ...refine: (GenericSchema | v.GenericPipeAction)[]
): InstanceSchema<NodeType, undefined> {
    //@ts-ignore
    return v.pipe(v.instance(classType), ...refine)
}

export const u = instancePipe

export type PatternUnit<T extends NodeType | unknown = unknown> =
    T extends NodeType
        ? T | InstanceIntersect<T> | PatternUnitWithValue<T>
        : NodeType | PatternUnitWithValue<NodeType> | GenericSchema

export interface DirectReplacer {
    tokenRange: [number, number]
    nodes: Node[]
}

export interface Rule<T extends PatternUnit[] = PatternUnit[]> {
    pattern: T
    factory: (
        nodes: {
            [K in keyof T]: T[K] extends PatternUnit<infer U extends NodeType>
                ? InstanceType<U>
                : Node
        },
        tokens: Token[],
        rule: Rule,
    ) => Node | null
    config?: Record<string, unknown> & {
        statement?: SuggestableStatement | true
        exported?: boolean
    }
    flags?: RULE_FLAGS[]
}

export function r<const T extends PatternUnit[]>(rule: Rule<T>): Rule {
    return rule as Rule
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
    | { after: NodeType }
    | { inside: NodeCapability }

export interface SuggestableStatement {
    name: string
    group: CompletionGroup
    visibility: StatementVisibility
}
