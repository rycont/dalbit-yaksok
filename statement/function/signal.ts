import { Signal, Token, ValueType, YaksokError } from '@dalbit-yaksok/core'
import { CannotReturnOutsideFunctionError } from './error/return-out-of-function'

export class ReturnSignal extends Signal {
    constructor(
        tokens: Token[],
        public value: ValueType | null = null,
    ) {
        super(tokens)
    }

    getUnhandledError(): YaksokError {
        return new CannotReturnOutsideFunctionError({
            tokens: this.tokens,
        })
    }
}
