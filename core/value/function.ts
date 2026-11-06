import type { ObjectValue, Rule, ValueType } from '@dalbit-yaksok/core'

export interface RunnableObject extends ObjectValue {
    readonly run: (args: Map<string, ValueType>) => Promise<ValueType>
    readonly name: string
    readonly invokeRules: Rule[]
}
