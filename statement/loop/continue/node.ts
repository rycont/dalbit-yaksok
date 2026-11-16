import { Executable, Token, Scope, YaksokError } from '@dalbit-yaksok/core'
import { ContinueSignal } from './signal'

export class Continue extends Executable {
    static override friendlyName = '다음 반복'

    constructor(public override tokens: Token[]) {
        super()
    }

    override execute(_scope: Scope): Promise<never> {
        throw new ContinueSignal(this.tokens)
    }

    override validate(): YaksokError[] {
        return []
    }
}
