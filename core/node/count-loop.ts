import { YaksokError } from '../error/common.ts'
import { LoopCountIsNotNumberError } from '../error/loop.ts'
import { Scope } from '../executer/scope.ts'
import { BreakSignal } from '../executer/signals.ts'
import { Token } from '../prepare/tokenize/token.ts'
import { NumberValue } from '../value/primitive.ts'
import { Evaluable, Executable } from './base.ts'
import { Block } from './block.ts'
import {
    LOOP_WARNING_THRESHOLD,
    emitLoopIterationWarning,
} from '../util/loop-warning.ts'

export class CountLoop extends Executable {
    static override friendlyName = '횟수 반복'

    constructor(
        public count: Evaluable,
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

        const countValue = await this.count.execute(scope)

        if (!(countValue instanceof NumberValue)) {
            throw new LoopCountIsNotNumberError({
                tokens: this.count.tokens,
                value: countValue,
            })
        }

        const countNumber = countValue.value

        let warned = false

        try {
            for (let i = 0; i < countNumber; i++) {
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

                const iterationCount = i + 1

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
                await this.body.execute(scope)
            }
        } catch (e) {
            if (!(e instanceof BreakSignal)) throw e
        }
    }

    override validate(scope: Scope): YaksokError[] {
        return this.body.validate(scope)
    }
}
