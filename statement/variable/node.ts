import {
    assignerToOperatorMap,
    Evaluable,
    Identifier,
    Scope,
    ScopeChain,
    SlotKey,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class SetVariable implements Statement {
    static friendlyName = '변수 정하기'

    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        public target: Identifier,
        private evaluator: Evaluable,
        public tokens: Token[],
        public operator: string,
    ) {}

    async execute(scopeChain: ScopeChain) {
        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await this.evaluator.execute(scopeChain)

        let newValue = operand

        if (operatorNode) {
            const oldValue = this.target.execute(scopeChain)
            const tempOperator = new operatorNode(this.tokens)

            try {
                newValue = await tempOperator.call(
                    () => Promise.resolve(oldValue),
                    () => Promise.resolve(operand),
                )
            } catch (error) {
                if (error instanceof YaksokError) {
                    if (!error.tokens) {
                        error.tokens = this.tokens
                    }
                }

                throw error
            }
        }

        const assignTargetRunId = scopeChain.get(this.target.scope)

        this.target.scope.run
            .get(assignTargetRunId)
            .set(this.target.slotKey, newValue)
    }

    validate(): YaksokError[] {
        if (this.parsingErrors.length) {
            for (const error of this.parsingErrors) {
                if (!error.scope) {
                    error.scope = this.scope
                }

                if (!error.tokens) {
                    error.tokens = this.tokens
                }
            }
        }

        const errors = this.evaluator.validate(this.scope)
        return this.parsingErrors.concat(errors)
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}
