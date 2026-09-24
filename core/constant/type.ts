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
