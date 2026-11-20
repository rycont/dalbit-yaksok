import { Node, Scope, Statement, Token, YaksokError } from '@dalbit-yaksok/core'

export class BrokenStatement implements Statement {
    public parsingErrors: YaksokError[] = []

    constructor(
        private nodes: Node[],
        public tokens: Token[],
    ) {}

    validate(scope: Scope): YaksokError[] {
        return this.nodes.flatMap((n) => n.validate(scope))
    }

    execute(scope: Scope): Promise<void> {
        throw this.validate(scope)[0]
    }
}
