import { ObjectValue, type ValueType } from './base.ts'
import { NumberValue } from './primitive.ts'

import { ReturnSignal } from '../executer/signals.ts'
import { Scope } from '../executer/scope.ts'

import type { Block } from '../node/block.ts'
import { YaksokError } from '../error/common.ts'
import { CallStackDepthExceededError } from '../error/function.ts'

const DEFAULT_RETURN_VALUE = new NumberValue(0)
const MAX_CALL_STACK_DEPTH = 32

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
        callSiteScope?: Scope,
    ) {
        const lexicalScope = this.declaredScope ?? callSiteScope
        const previousDepth =
            callSiteScope?.callStackDepth ?? lexicalScope?.callStackDepth ?? 0
        const nextDepth = previousDepth + 1

        if (nextDepth > MAX_CALL_STACK_DEPTH) {
            const errorInstance = new CallStackDepthExceededError({
                resource: { limit: MAX_CALL_STACK_DEPTH, depth: nextDepth },
            })
            errorInstance.codeFile =
                this.declaredScope?.codeFile ?? callSiteScope?.codeFile ??
                    lexicalScope?.codeFile
            throw errorInstance
        }

        const functionScope = new Scope({
            parent: lexicalScope,
            initialVariable: args,
            callStackDepth: nextDepth,
        })

        try {
            await this.body.execute(functionScope)
        } catch (e) {
            if (e instanceof ReturnSignal) {
                return e.value || DEFAULT_RETURN_VALUE
            }

            if (e instanceof YaksokError && !e.codeFile) {
                e.codeFile =
                    this.declaredScope?.codeFile ?? callSiteScope?.codeFile ??
                        lexicalScope?.codeFile
            }

            throw e
        }

        return DEFAULT_RETURN_VALUE
    }
}

export interface RunnableObject extends ObjectValue {
    run(args: Record<string, ValueType>, fileScope?: Scope): Promise<ValueType>
    name: string
}
