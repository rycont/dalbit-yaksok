import { Token, YaksokError } from '@dalbit-yaksok/core'

export abstract class Signal {
    constructor(public tokens: Token[]) {}

    abstract getUnhandledError(): YaksokError
}

export class AbortedSessionSignal extends Signal {
    getUnhandledError() {
        return new YaksokError({})
    }
}
