import type { Token } from '../prepare/tokenize/token.ts'

export class Signal {
    constructor(public tokens: Token[]) {}
}

export class ReturnSignal extends Signal {}
export class BreakSignal extends Signal {}
