import {
    Evaluable,
    Statement,
    Token,
    YaksokError,
    RunFrame,
} from '@dalbit-yaksok/core'

import { ReturnSignal } from '../signal'

export class ReturnStatement implements Statement {
    static friendlyName = '반환하기'
    public parsingErrors: YaksokError[] = []

    constructor(
        public tokens: Token[],
        private value?: Evaluable,
    ) {}

    async execute(runFrame: RunFrame) {
        if (!this.value) {
            throw new ReturnSignal(this.tokens, null)
        }

        const returnValue = await this.value?.execute(runFrame)
        throw new ReturnSignal(this.tokens, returnValue)
    }

    validate(): YaksokError[] {
        if (this.value) {
            return this.value?.validate()
        }

        return []
    }
}
