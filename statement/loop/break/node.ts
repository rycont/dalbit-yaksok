import { Scope, Statement, Token, YaksokError } from '@dalbit-yaksok/core'
import { BreakSignal } from './signal'

export class Break implements Statement {
    static friendlyName = '그만'
    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        public tokens: Token[],
    ) {}

    execute(): Promise<never> {
        throw new BreakSignal(this.tokens)
    }

    validate(): YaksokError[] {
        return []
    }
}
