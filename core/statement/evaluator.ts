import {
    Evaluable,
    Extension,
    Scope,
    Statement,
    StatementCaller,
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

    static SRFallback: Extension = {
        capabilties: {
            Grammer: [
                {
                    name: '',
                    factory(code, parse) {
                        const [line, lineConsumed] = code.consume()

                        const parsed = parse.value(line.validTokens)

                        if (parsed instanceof StatementCaller) {
                            const [bodyTokens, bodyConsumed] =
                                lineConsumed.block.consume()

                            const body = parse.statement(bodyTokens)

                            const statement = parsed.toStatement(body)

                            return {
                                instance: statement,
                                consumed: bodyConsumed,
                            }
                        }

                        return {
                            instance: new Evaluator(parsed, parsed.tokens),
                            consumed: lineConsumed,
                        }
                    },
                },
            ],
        },
    }
}
