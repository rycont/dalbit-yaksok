import { ObjectValue, type ValueType } from './base.ts'
import { NumberValue } from './primitive.ts'

import { ReturnSignal } from '../executer/signals.ts'
import { Scope } from '../executer/scope.ts'

import type { Block } from '../node/block.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)

export class FunctionObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '약속'

    constructor(
        public name: string,
        private body: Block,
        private delcaredScope?: Scope,
    ) {
        super()
    }

    public async run(
        args: Record<string, ValueType>,
        fileScope: Scope | undefined = this.delcaredScope,
    ) {
        const functionScope = new Scope({
            parent: fileScope,
            initialVariable: args,
        })

        let returnValue: ValueType = DEFAULT_RETURN_VALUE

        try {
            await this.body.execute(functionScope)
        } catch (e) {
            if (!(e instanceof ReturnSignal)) {
                throw e
            }

            if (e.value) {
                returnValue = e.value
            }
        }

        return returnValue
    }
}

export interface RunnableObject extends ObjectValue {
    run(args: Record<string, ValueType>, fileScope?: Scope): Promise<ValueType>
    name: string
}
