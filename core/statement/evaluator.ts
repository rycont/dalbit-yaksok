import {
    Evaluable,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class Evaluator implements Statement {
    public parsingErrors: YaksokError[] = []

    constructor(
        public evaluable: Evaluable,
        public tokens: Token[],
    ) {}

    async execute(scope: Scope) {
        await this.evaluable.execute(scope)
    }

    validate(scope: Scope) {
        return this.evaluable.validate(scope)
    }
}
