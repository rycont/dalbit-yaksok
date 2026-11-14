import {
    assignerToOperatorMap,
    Evaluable,
    Executable,
    IndexFetch,
    Scope,
    Token,
    YaksokError,
} from '@dalbit-yaksok/core'

export class SetToIndex extends Executable<Evaluable> {
    static override friendlyName = '목록에 값 넣기'

    constructor(
        public target: IndexFetch,
        value: Evaluable,
        private readonly operator: string,
        public override tokens: Token[],
    ) {
        super()
        this.subnode = value
    }

    override async execute(scope: Scope): Promise<void> {
        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await this.subnode.execute(scope)
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

    override validate(scope: Scope): YaksokError[] {
        const errors = [
            ...(this.target.validate(scope) || []),
            ...(this.subnode.validate(scope) || []),
        ]

        return errors
    }
}
