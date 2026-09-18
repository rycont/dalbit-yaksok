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
        private declaredScope?: Scope,
        public paramNames: string[] = [],
    ) {
        super()
    }

    public async run(args: Record<string, ValueType>, callSiteScope?: Scope) {
        const lexicalScope = this.declaredScope ?? callSiteScope

        const functionScope = new Scope({
            parent: lexicalScope,
            initialVariable: args,
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
    run(args: Record<string, ValueType>, fileScope?: Scope): Promise<ValueType>
    name: string
    paramNames: string[]
}
