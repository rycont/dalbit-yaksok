import type { Brand, ObjectValue, ValueType } from '@dalbit-yaksok/core'

export const Runnable = Symbol() as Brand<symbol, 'Runnable_Run'>

export interface RunnableObject extends ObjectValue {
    readonly [Runnable]: {
        readonly run: (
            args: Map<string | symbol, ValueType>,
        ) => Promise<ValueType | void>
        readonly name?: string
    }
}

export function isRunnable(value: ValueType): value is RunnableObject {
    return Runnable in value
}
