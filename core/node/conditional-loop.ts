import { BreakSignal, ContinueSignal } from '../executer/signals.ts'
import { Evaluable, Executable, NodeCapability } from './base.ts'
import { YaksokError } from '../error/common.ts'
import { LoopWithoutBodyError } from '../error/loop.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { Block } from './block.ts'
import { isTruthy } from '../executer/internal/isTruthy.ts'
import {
    emitLoopIterationWarning,
    LOOP_WARNING_THRESHOLD,
} from '../util/loop-warning.ts'

export class ConditionalLoop extends Executable<{
    condition: Evaluable
    body: Block
}> {
    static override friendlyName = '반복 동안'
    static override accepts = [NodeCapability.LOOP_CONTROL]

    constructor(
        condition: Evaluable,
        body: Block,
        public override tokens: Token[],
    ) {
        super()

        this.subnode = {
            condition,
            body,
        }
    }

    override async execute(scope: Scope) {
        if (this.subnode.body.tokens.length === 0) {
            return
        }

        let iterationCount = 0
        let warned = false

        try {
            while (true) {
                const conditionValue =
                    await this.subnode.condition.execute(scope)
                if (!isTruthy(conditionValue)) {
                    break
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
                    childTokens: this.subnode.body.tokens,
                    skipReport: true,
                })
                try {
                    await this.subnode.body.execute(scope)
                } catch (e) {
                    if (e instanceof ContinueSignal) continue
                    throw e
                }
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) {
                throw e
            }
        }
    }

    override validate(scope: Scope): YaksokError[] {
        const childErrors = this.subnode.body.validate(scope)
        const conditionErrors = this.subnode.condition.validate(scope)

        const hasBodyError =
            this.subnode.body.subnode.length === 0
                ? new LoopWithoutBodyError({
                      tokens: this.tokens,
                  })
                : null

        return [...conditionErrors, ...childErrors, hasBodyError].filter(
            Boolean,
        ) as YaksokError[]
    }
}
