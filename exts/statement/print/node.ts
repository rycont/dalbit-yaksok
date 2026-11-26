import {
    Evaluable,
    Token,
    Scope,
    YaksokError,
    Statement,
    RunFrame,
} from '@dalbit-yaksok/core'

export class Print implements Statement {
    static friendlyName = '보여주기'
    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        private value: Evaluable,
        public tokens: Token[],
    ) {}

    async execute(runFrame: RunFrame): Promise<void> {
        const printFunction = this.scope.session?.stdout ?? console.log
        const evaluated = await this.value.execute(runFrame)

        printFunction(evaluated.toPrint())
    }

    validate(): YaksokError[] {
        return this.value.validate()
    }
}
