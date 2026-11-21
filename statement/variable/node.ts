import {
    assignerToOperatorMap,
    Evaluable,
    NotProperIdentifierNameToDefineError,
    NumberValue,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class SetVariable implements Statement {
    static friendlyName = '변수 정하기'

    public parsingErrors: YaksokError[] = []

    constructor(
        public name: string,
        private evaluator: Evaluable,
        public tokens: Token[],
        public operator: string,
    ) {}

    async execute(scope: Scope) {
        const { name, evaluator } = this

        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await evaluator.execute(scope)

        let newValue = operand

        if (operatorNode) {
            const oldValue = scope.getVariable(name, this.tokens)
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

        scope.setVariable(name, newValue)
    }

    validate(scope: Scope): YaksokError[] {
        if (this.parsingErrors.length) {
            for (const error of this.parsingErrors) {
                if (!error.scope) {
                    error.scope = scope
                }

                if (!error.tokens) {
                    error.tokens = this.tokens
                }
            }

            return this.parsingErrors
        }

        const errors = this.evaluator.validate(scope)

        try {
            scope.setVariable(this.name, new NumberValue(0))
            return errors
        } catch (e) {
            if (e instanceof NotProperIdentifierNameToDefineError) {
                e.scope = scope
                e.tokens = this.tokens
            }

            if (e instanceof YaksokError) {
                return errors.concat([e])
            }

            throw e
        }
    }

    public injectParsingError(parsingError: YaksokError) {
        this.parsingErrors.push(parsingError)
    }
}
