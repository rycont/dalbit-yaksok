import type { ObjectValue, Rule, ValueType } from '@dalbit-yaksok/core'

export interface RunnableObject extends ObjectValue {
    readonly run: (
        args: Map<string | symbol, ValueType>,
    ) => Promise<ValueType | void>
    readonly name: string
    readonly invokeRules: Rule[]
}
