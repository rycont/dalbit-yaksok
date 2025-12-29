import { YaksokError } from '../error/common.ts'
import { NotEnumerableValueForListLoopError } from '../error/index.ts'
import { BreakSignal } from '../executer/signals.ts'
import { type Evaluable, Executable } from './base.ts'

import { Scope } from '../executer/scope.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import { IndexedValue } from '../value/indexed.ts'
import { NumberValue } from '../value/primitive.ts'
import type { Block } from './block.ts'
import {
    emitLoopIterationWarning,
    LOOP_WARNING_THRESHOLD,
} from '../util/loop-warning.ts'

export class ListLoop extends Executable {
    static override friendlyName = '목록 반복'

    constructor(
        public list: Evaluable,
        public variableName: string,
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(_scope: Scope): Promise<void> {
        const scope = new Scope({
            parent: _scope,
            callerNode: this,
        })

        const list = await this.list.execute(scope)

        this.assertRepeatTargetIsList(list)

        let iterationCount = 0
        let warned = false

        try {
            for (const value of list.enumerate()) {
                if (scope.codeFile?.session?.canRunNode) {
                    if (
                        !(await scope.codeFile?.session?.canRunNode(
                            scope,
                            this.body,
                        ))
                    ) {
                        return
                    }
                }

                iterationCount += 1

                if (!warned && iterationCount > LOOP_WARNING_THRESHOLD) {
                    emitLoopIterationWarning({
                        scope,
                        tokens: this.tokens,
                        iterations: iterationCount,
                    })
                    warned = true
                }

                await this.onRunChild({
                    scope,
                    childTokens: this.body.tokens,
                    skipReport: true,
                })
                scope.setVariable(this.variableName, value, this.tokens)
                await this.body.execute(scope)
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) throw e
        }
    }

    assertRepeatTargetIsList(
        target: ValueType,
    ): asserts target is IndexedValue {
        if (target instanceof IndexedValue) return

        throw new NotEnumerableValueForListLoopError({
            resource: {
                value: target,
            },
            tokens: this.list.tokens,
        })
    }

    override validate(scope: Scope): YaksokError[] {
        const listScope = new Scope({
            parent: scope,
            callerNode: this,
            initialVariable: {
                [this.variableName]: new NumberValue(0),
            },
        })

        const listErrors = this.list.validate(scope)
        const bodyErrors = this.body.validate(listScope)

        return [...listErrors, ...bodyErrors]
    }
}
