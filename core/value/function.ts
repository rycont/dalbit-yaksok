import {
    Block,
    NumberValue,
    ObjectValue,
    Rule,
    Scope,
    ValueType,
} from '@dalbit-yaksok/core'

import { ReturnSignal } from '../executer/signals.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)

export class FunctionObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '약속'

    constructor(
        public name: string,
        private body: Block,
        public invokeRules: Rule[],
        private declaredScope: Scope,
    ) {
        super()
    }

    public async run(args: Map<string, ValueType>): Promise<ValueType> {
        const functionScope = new Scope({
            parent: this.declaredScope,
            initialVariable: Object.fromEntries(args.entries()),
        })

        try {
            await this.body.execute(functionScope)
        } catch (e) {
            if (e instanceof ReturnSignal) {
                return e.value || DEFAULT_RETURN_VALUE
            }

            throw e
        }

        return DEFAULT_RETURN_VALUE
    }
}

export interface RunnableObject extends ObjectValue {
    readonly run: (args: Map<string, ValueType>) => Promise<ValueType>
    readonly name: string
    readonly invokeRules: Rule[]
}
