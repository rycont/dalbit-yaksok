import {
    Evaluable,
    hasReferenceSlot,
    RDRule,
    ReferenceSlot,
    RunFrame,
    Scope,
    SlotKey,
    Statement,
    StatementCaller,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class Evaluator implements Statement {
    public parsingErrors: YaksokError[] = []
    public [ReferenceSlot]?: SlotKey

    constructor(
        public scope: Scope,
        public evaluable: Evaluable,
        public tokens: Token[],
    ) {
        if (hasReferenceSlot(evaluable)) {
            this[ReferenceSlot] = evaluable[ReferenceSlot]
        }
    }

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
                const blockResult = parsed.toStatement(code, parse, scope)
                return blockResult
            }

            return {
                instance: new Evaluator(scope, parsed, parsed.tokens),
                consumed: lineConsumed,
            }
        },
    }
}
