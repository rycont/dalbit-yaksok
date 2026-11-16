import {
    assignerToOperatorMap,
    Evaluable,
    IndexFetch,
    Scope,
    Statement,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class SetToIndex implements Statement {
    static friendlyName = '목록에 값 넣기'

    constructor(
        public readonly target: IndexFetch,
        private readonly value: Evaluable,
        private readonly operator: string,
        public readonly tokens: Token[],
    ) {}

    async execute(scope: Scope): Promise<void> {
        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await this.value.execute(scope)
        let newValue = operand

        if (operatorNode) {
            const oldValue = await this.target.execute(scope)
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

        await this.target.setValue(scope, newValue)
    }

    validate(scope: Scope): YaksokError[] {
        const errors = [
            ...(this.target.validate(scope) || []),
            ...(this.value.validate(scope) || []),
        ]

        return errors
    }
}
