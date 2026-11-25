import type { SlotKey, ValueType } from '@dalbit-yaksok/core'

export const Runnable = Symbol('Runnable')

export interface RunnableCapability {
    readonly run: (args: Map<SlotKey, ValueType>) => Promise<ValueType | void>
    readonly name: string | null
}

export interface RunnableObject {
    readonly [Runnable]: RunnableCapability
}

export function isRunnable<T>(value: T): value is T & RunnableObject {
    return typeof value === 'object' && value !== null && Runnable in value
}
