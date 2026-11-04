import type { Token } from '@dalbit-yaksok/core'

export type Brand<K, T> = K & { __brand: T }

export interface ParameterElement {
    name: string
    optional: boolean
    tokens: Token[]
}

export interface TokenRule {
    name: string
    description: string
    factory(token: Token[]): null | Node
}
