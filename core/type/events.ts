import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export interface LoopIterationLimitExceededWarning {
    type: 'loop-iteration-limit-exceeded'
    iterations: number
    scope: Scope
    tokens: Token[]
}

export type WarningEvent = LoopIterationLimitExceededWarning
