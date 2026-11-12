import {
    BreakNotInLoopError,
    ContinueNotInLoopError,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export abstract class Signal {
    constructor(public tokens: Token[]) {}

    abstract getUnhandledError(): YaksokError
}

export class BreakSignal extends Signal {
    getUnhandledError() {
        return new BreakNotInLoopError({
            tokens: this.tokens,
        })
    }
}

export class ContinueSignal extends Signal {
    getUnhandledError() {
        return new ContinueNotInLoopError({
            tokens: this.tokens,
        })
    }
}

export class AbortedSessionSignal extends Signal {
    getUnhandledError() {
        return new YaksokError({})
    }
}
