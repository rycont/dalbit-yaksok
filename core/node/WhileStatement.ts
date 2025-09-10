import { Executable } from './base.ts'
import { Block } from './block.ts'
import { YaksokError } from '../error/common.ts'
import { isTruthy } from '../executer/internal/isTruthy.ts'
import { Scope } from '../executer/scope.ts'
import { BreakSignal, ContinueSignal } from '../executer/signals.ts'
import { Token } from '../prepare/tokenize/token.ts'
import { Evaluable } from './base.ts'

export class WhileStatement extends Executable {
    constructor(
        public condition: Evaluable,
        public body: Block,
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(scope: Scope) {
        while (isTruthy(await this.condition.execute(scope))) {
            try {
                await this.body.execute(scope)
            } catch (e) {
                if (e instanceof BreakSignal) {
                    break
                }
                if (e instanceof ContinueSignal) {
                    continue
                }
                throw e
            }
        }
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = [
            ...this.condition.validate(scope),
            ...this.body.validate(scope),
        ]

        return errors
    }
}
