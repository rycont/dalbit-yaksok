import { ContinueNotInLoopError, Signal } from '@dalbit-yaksok/core'

export class ContinueSignal extends Signal {
    getUnhandledError() {
        return new ContinueNotInLoopError({
            tokens: this.tokens,
        })
    }
}
