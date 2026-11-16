import {
    Block,
    NumberValue,
    ObjectValue,
    RunnableObject,
    Scope,
    ValueType,
    RuleList,
} from '@dalbit-yaksok/core'
import { ReturnSignal } from '../signal.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)

export class FunctionObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '약속'

    constructor(
        public name: string,
        private body: Block,
        public invokeRules: RuleList,
        private declaredScope: Scope,
    ) {
        super()
    }

    public async run(
        args: Map<string | symbol, ValueType>,
    ): Promise<ValueType> {
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
