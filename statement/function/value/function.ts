import {
    Block,
    NumberValue,
    ObjectValue,
    RunnableObject,
    Scope,
    ScopeChain,
    ValueType,
} from '@dalbit-yaksok/core'
import { ReturnSignal } from '../signal.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)

export class FunctionObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '약속'

    constructor(
        public name: string,
        private body: Block,
        private runningScope: Scope,
    ) {
        super()
    }

    public async run(
        args: Map<symbol, ValueType>,
        scopeChain: ScopeChain,
    ): Promise<ValueType> {
        try {
            const newChain = new Map(scopeChain)
            const newRun = Symbol()

            newChain.set(this.runningScope, newRun)
            this.runningScope.run.set(newRun, new Map(args))

            await this.body.execute(newChain)
        } catch (e) {
            if (e instanceof ReturnSignal) {
                return e.value || DEFAULT_RETURN_VALUE
            }

            throw e
        }

        return DEFAULT_RETURN_VALUE
    }
}
