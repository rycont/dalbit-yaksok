import { Token } from '@dalbit-yaksok/core'

export abstract class Signal {
    constructor(public tokens: Token[]) {}
}

export class BreakSignal extends Signal {}

export class ContinueSignal extends Signal {}

export class AbortedSessionSignal extends Signal {}
