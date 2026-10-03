import { Token } from '@dalbit-yaksok/core'

export type Brand<K, T> = K & { __brand: T }

export interface ParameterElement {
    name: string
    optional: boolean
    tokens: Token[]
}

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}
