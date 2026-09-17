import { ReturnSignal } from '../executer/signals.ts'
import { Evaluable, Executable } from './base.ts'
import { YaksokError } from '../error/common.ts'

import type { Token } from '../prepare/tokenize/token.ts'
import type { Scope } from '../executer/scope.ts'

export class ReturnStatement extends Executable<Evaluable | null> {
    static override friendlyName = '반환하기'

    constructor(
        public override tokens: Token[],
        subnode?: Evaluable,
    ) {
        super()
        this.subnode = subnode || null
    }

    override async execute(scope: Scope) {
        if (!this.subnode) {
            throw new ReturnSignal(this.tokens, null)
        }

        const returnValue = await this.subnode?.execute(scope)
        throw new ReturnSignal(this.tokens, returnValue)
    }

    override validate(scope: Scope): YaksokError[] {
        if (this.subnode) {
            return this.subnode?.validate(scope)
        }

        return []
    }
}
