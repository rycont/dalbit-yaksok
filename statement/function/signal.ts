import { Signal, Token, ValueType } from '@dalbit-yaksok/core'

export class ReturnSignal extends Signal {
    constructor(
        tokens: Token[],
        public value: ValueType | null = null,
    ) {
        super(tokens)
    }
}
