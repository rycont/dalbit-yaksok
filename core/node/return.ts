import { ReturnSignal } from '../executer/signals.ts'
import { Evaluable, Executable } from './base.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'

export class ReturnStatement extends Executable {
    static override friendlyName = '반환하기'

    constructor(public override tokens: Token[], public value?: Evaluable) {
        super()
    }

    override async execute(scope: Scope) {
        if (!this.value) {
            throw new ReturnSignal(this.tokens, null)
        }

        const returnValue = await this.value.execute(scope)
        throw new ReturnSignal(this.tokens, returnValue)
    }

    override validate(scope: Scope) {
        if (this.value) {
            return this.value.validate(scope)
        }

        return []
    }
}
