import { ObjectValue, type ValueType } from './base.ts'
import { NumberValue } from './primitive.ts'

import { ReturnSignal } from '../executer/signals.ts'
import { Scope } from '../executer/scope.ts'

import type { Block } from '../node/block.ts'
import { YaksokError } from '../error/common.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)

export class FunctionObject extends ObjectValue implements RunnableObject {
    static override friendlyName = '약속'

    constructor(
        public name: string,
        private body: Block,
        private declaredScope?: Scope,
    ) {
        super()
    }

    public async run(
        args: Record<string, ValueType>,
        fileScope: Scope | undefined = this.declaredScope,
    ) {
        const functionScope = new Scope({
            parent: fileScope,
            initialVariable: args,
        })

        try {
            await this.body.execute(functionScope)
        } catch (e) {
            if (e instanceof ReturnSignal) {
                return e.value || DEFAULT_RETURN_VALUE
            }

            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile = this.declaredScope?.codeFile
            }

            throw e
        }

        return DEFAULT_RETURN_VALUE
    }

    public validate(
        args: Record<string, ValueType>,
        fileScope: Scope | undefined = this.declaredScope,
    ): YaksokError[] | null {
        const functionScope = new Scope({
            parent: fileScope,
            initialVariable: args,
        })

        return this.body.validate(functionScope)
    }
}

export interface RunnableObject extends ObjectValue {
    run(args: Record<string, ValueType>, fileScope?: Scope): Promise<ValueType>
    name: string
}
