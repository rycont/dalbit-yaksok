import type { ObjectValue, ScopeChain, ValueType } from '@dalbit-yaksok/core'

export interface RunnableObject extends ObjectValue {
    readonly run: (
        args: Map<string | symbol, ValueType>,
        scopeChain: ScopeChain,
    ) => Promise<ValueType | void>
    readonly name?: string
}
