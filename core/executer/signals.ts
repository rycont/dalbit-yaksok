import type { Token } from '../prepare/tokenize/token.ts'
import { ValueType } from '../value/base.ts'

export class Signal {
    constructor(public tokens: Token[]) {}
}

export class ReturnSignal extends Signal {
    constructor(
        tokens: Token[],
        public value: ValueType | null = null,
    ) {
        super(tokens)
    }
}

export class BreakSignal extends Signal {}

export class ContinueSignal extends Signal {}

export class AbortedSessionSignal extends Signal {}
