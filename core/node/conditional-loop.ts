import { BreakSignal, ContinueSignal } from '../executer/signals.ts'
import { Evaluable, Executable } from './base.ts'
import { YaksokError } from '../error/common.ts'
import { LoopWithoutBodyError } from '../error/loop.ts'
import type { Scope } from '../executer/scope.ts'
import { BooleanValue } from '../value/primitive.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { Block } from './block.ts'
import {
    emitLoopIterationWarning,
    LOOP_WARNING_THRESHOLD,
} from '../util/loop-warning.ts'

export class ConditionalLoop extends Executable {
    static override friendlyName = '반복 동안'

    constructor(
        public condition: Evaluable,
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope) {
        if (this.body.tokens.length === 0) {
            return
        }

        let iterationCount = 0
        let warned = false

        try {
            while (true) {
                const conditionValue = await this.condition.execute(scope)
                if (
                    !(conditionValue instanceof BooleanValue) ||
                    !conditionValue.value
                ) {
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
                    childTokens: this.body.tokens,
                    skipReport: true,
                })
                try {
                    await this.body.execute(scope)
                } catch (e) {
                    if (e instanceof ContinueSignal) {
                        continue
                    }
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
        const childErrors = this.body.validate(scope)
        const conditionErrors = this.condition.validate(scope)

        const hasBodyError =
            this.body.children.length === 0
                ? new LoopWithoutBodyError({
                      tokens: this.tokens,
                  })
                : null

        return [...conditionErrors, ...childErrors, hasBodyError].filter(
            Boolean,
        ) as YaksokError[]
    }
}
