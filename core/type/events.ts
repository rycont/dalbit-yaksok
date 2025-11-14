import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'

export interface LoopIterationLimitExceededWarning {
    type: 'loop-iteration-limit-exceeded'
    iterations: number
    scope: Scope
    tokens: Token[]
}

export type WarningEvent = LoopIterationLimitExceededWarning

export interface VariableSetEvent {
    type: 'variable-set'
    name: string
    value: ValueType
    scope: Scope
    tokens?: Token[]
}

export interface VariableReadEvent {
    type: 'variable-read'
    name: string
    value: ValueType
    scope: Scope
    tokens?: Token[]
}
