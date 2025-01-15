import { NotDefinedIdentifierError } from '../error/variable.ts'
import { ReturnSignal } from '../executer/signals.ts'

import { Scope } from '../executer/scope.ts'
import { ObjectValue, ValueType } from './base.ts'

import type { Block } from '../node/block.ts'
import { NumberValue } from './primitive.ts'

const RESULT_VARIABLE_NAME = '결과'
const DEFAULT_RESULT_VALUE = new NumberValue(0)

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

        try {
            await this.body.execute(functionScope)
        } catch (e) {
            if (!(e instanceof ReturnSignal)) {
                throw e
            }
        }

        let result: ValueType = DEFAULT_RESULT_VALUE

        try {
            result = functionScope.getVariable(RESULT_VARIABLE_NAME)
        } catch (e) {
            if (!(e instanceof NotDefinedIdentifierError)) {
                throw e
            }
        }

        return result
    }
}

export interface RunnableObject extends ObjectValue {
    run(args: Record<string, ValueType>, fileScope?: Scope): Promise<ValueType>
    name: string
}
