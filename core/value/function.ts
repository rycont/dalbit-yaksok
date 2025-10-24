import { ObjectValue, type ValueType } from './base.ts'
import { NumberValue } from './primitive.ts'

import { ReturnSignal } from '../executer/signals.ts'
import { Scope } from '../executer/scope.ts'

import type { Block } from '../node/block.ts'
import { YaksokError } from '../error/common.ts'
import { CallStackDepthExceededError } from '../error/function.ts'
import { FEATURE_FLAG } from '../constant/feature-flags.ts'

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

    public async run(args: Record<string, ValueType>, callSiteScope?: Scope) {
        const lexicalScope = this.declaredScope ?? callSiteScope
        const previousDepth =
            callSiteScope?.callStackDepth ?? lexicalScope?.callStackDepth ?? 0
        const nextDepth = previousDepth + 1

        if (nextDepth > MAX_CALL_STACK_DEPTH) {
            // FEATURE FLAG 확인: DISABLE_CALL_STACK_DEPTH_LIMIT가 활성화되면 에러를 발생시키지 않음
            const codeFile =
                this.declaredScope?.codeFile ??
                callSiteScope?.codeFile ??
                lexicalScope?.codeFile
            const isDisabled =
                codeFile?.session?.flags[
                    FEATURE_FLAG.DISABLE_CALL_STACK_DEPTH_LIMIT
                ] === true

            if (!isDisabled) {
                const errorInstance = new CallStackDepthExceededError({
                    resource: { limit: MAX_CALL_STACK_DEPTH, depth: nextDepth },
                })
                errorInstance.codeFile = codeFile
                throw errorInstance
            }
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
                    this.declaredScope?.codeFile ??
                    callSiteScope?.codeFile ??
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
