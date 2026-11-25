import {
    assignerToOperatorMap,
    Evaluable,
    Identifier,
    RunFrame,
    Scope,
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

    async execute(runFrame: RunFrame) {
        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await this.evaluator.execute(runFrame)

        let newValue = operand

        if (operatorNode) {
            const oldValue = this.target.execute(runFrame)
            const tempOperator = new operatorNode(this.scope, this.tokens)

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

        runFrame.set(this.target.slotKey, newValue)
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

        const errors = this.evaluator.validate()
        return this.parsingErrors.concat(errors)
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}
