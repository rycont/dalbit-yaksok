import {
    Evaluable,
    RDRule,
    RunFrame,
    Scope,
    Statement,
    StatementCaller,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class Evaluator implements Statement {
    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        public evaluable: Evaluable,
        public tokens: Token[],
    ) {}

    async execute(runFrame: RunFrame) {
        await this.evaluable.execute(runFrame)
    }

    validate() {
        return this.evaluable.validate()
    }

    static SRFallback: RDRule = {
        name: 'SR Fallback',
        factory(code, parse, scope) {
            const [line, lineConsumed] = code.consume()

            const parsed = parse.value(line.validTokens)

            if (parsed instanceof StatementCaller && lineConsumed.block) {
                const [bodyTokens, bodyConsumed] = lineConsumed.block.consume()

                const body = parse.statement(bodyTokens)

                const statement = parsed.toStatement(body)

                return {
                    instance: statement,
                    consumed: bodyConsumed,
                }
            }

            return {
                instance: new Evaluator(scope, parsed, parsed.tokens),
                consumed: lineConsumed,
            }
        },
    }
}
