import { Scope, Statement, Token, YaksokError } from '@dalbit-yaksok/core'
import { BreakSignal } from './signal'

export class Break implements Statement {
    static friendlyName = '그만'

    constructor(public tokens: Token[]) {}

    execute(_scope: Scope): Promise<never> {
        throw new BreakSignal(this.tokens)
    }

    validate(): YaksokError[] {
        return []
    }
}
