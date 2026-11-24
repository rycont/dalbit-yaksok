import {
    assignerToOperatorMap,
    Evaluable,
    IndexFetch,
    Statement,
    Token,
    YaksokError,
    RunFrame,
    Scope,
} from '@dalbit-yaksok/core'

export class SetToIndex implements Statement {
    static friendlyName = '목록에 값 넣기'
    public parsingErrors: YaksokError[] = []

    constructor(
        public scope: Scope,
        public readonly target: IndexFetch,
        private readonly value: Evaluable,
        private readonly operator: string,
        public readonly tokens: Token[],
    ) {}

    async execute(runFrame: RunFrame): Promise<void> {
        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await this.value.execute(runFrame)
        let newValue = operand

        if (operatorNode) {
            const oldValue = await this.target.execute(runFrame)
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

        await this.target.setValue(runFrame, newValue)
    }

    validate(): YaksokError[] {
        const errors = [
            ...(this.target.validate() || []),
            ...(this.value.validate() || []),
        ]

        return errors
    }
}
