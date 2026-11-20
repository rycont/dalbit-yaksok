import {
    Evaluable,
    Token,
    Scope,
    YaksokError,
    Statement,
} from '@dalbit-yaksok/core'

export class Print implements Statement {
    static friendlyName = '보여주기'
    public parsingErrors: YaksokError[] = []

    constructor(
        private value: Evaluable,
        public tokens: Token[],
    ) {}

    async execute(scope: Scope): Promise<void> {
        const printFunction = scope.session?.stdout ?? console.log
        const evaluated = await this.value.execute(scope)

        printFunction(evaluated.toPrint())
    }

    validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}
