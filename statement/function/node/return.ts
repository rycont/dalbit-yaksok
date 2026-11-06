import {
    Evaluable,
    Executable,
    Scope,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

import { ReturnSignal } from '../signal'

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
