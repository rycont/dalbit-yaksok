import {
    Evaluable,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

import { ReturnSignal } from '../signal'

export class ReturnStatement implements Statement {
    static friendlyName = '반환하기'

    constructor(
        public tokens: Token[],
        private value?: Evaluable,
    ) {}

    async execute(scope: Scope) {
        if (!this.value) {
            throw new ReturnSignal(this.tokens, null)
        }

        const returnValue = await this.value?.execute(scope)
        throw new ReturnSignal(this.tokens, returnValue)
    }

    validate(scope: Scope): YaksokError[] {
        if (this.value) {
            return this.value?.validate(scope)
        }

        return []
    }
}
