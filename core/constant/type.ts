import { YaksokError } from '../error/common.ts'
import { Scope, Token } from '@dalbit-yaksok/core'
import { ValueType } from '../value/base.ts'

export type Brand<K, T> = K & { __brand: T }

export interface ParameterElement {
    name: string
    optional: boolean
    tokens: Token[]
}

export interface FunctionInvokingParams {
    [key: string]: ValueType
}

export interface RunModuleResultBase {
    reason: string
    scope?: Scope
    errors?: YaksokError[]
}

export interface SuccessRunModuleResult extends RunModuleResultBase {
    reason: 'finish'
    scope: Scope
}

export interface AbortedRunModuleResult extends RunModuleResultBase {
    reason: 'aborted'
    scope: Scope
}

export interface ErrorRunModuleResult extends RunModuleResultBase {
    reason: 'error'
    errors: YaksokError[]
}

export type ValidationRunModuleResult = RunModuleResultBase & {
    reason: 'validation'
    errors: YaksokError[]
}

export type RunModuleResult =
    | SuccessRunModuleResult
    | AbortedRunModuleResult
    | ErrorRunModuleResult
    | ValidationRunModuleResult
