import { Executable, Scope, Token, YaksokError } from '@dalbit-yaksok/core'
import { BreakSignal } from './signal'

export class Break extends Executable {
    static override friendlyName = '그만'

    constructor(public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<never> {
        throw new BreakSignal(this.tokens)
    }

    override validate(): YaksokError[] {
        return []
    }
}
