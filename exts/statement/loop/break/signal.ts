import { BreakNotInLoopError, Signal } from '@dalbit-yaksok/core'

export class BreakSignal extends Signal {
    getUnhandledError() {
        return new BreakNotInLoopError({
            tokens: this.tokens,
        })
    }
}
