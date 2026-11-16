import { Token, Scope, YaksokError, Statement } from '@dalbit-yaksok/core'
import { ContinueSignal } from './signal'

export class Continue implements Statement {
    static friendlyName = '다음 반복'

    constructor(public tokens: Token[]) {}

    execute(_scope: Scope): Promise<never> {
        throw new ContinueSignal(this.tokens)
    }

    validate(): YaksokError[] {
        return []
    }
}
