import {
    assignerToOperatorMap,
    Evaluable,
    NotProperIdentifierNameToDefineError,
    NumberValue,
    Scope,
    Token,
    ValueType,
    YaksokError,
} from '@dalbit-yaksok/core'

export class SetVariable extends Evaluable<Evaluable> {
    static override friendlyName = '변수 정하기'

    constructor(
        public name: string,
        evaluator: Evaluable,
        public override tokens: Token[],
        public operator: string,
    ) {
        super()
        this.subnode = evaluator
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const { name, subnode: evaluator } = this

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
        return newValue
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.subnode.validate(scope)

        try {
            scope.setVariable(this.name, new NumberValue(0))
        } catch (e) {
            if (e instanceof NotProperIdentifierNameToDefineError) {
                e.scope = scope
                e.tokens = this.tokens
            }
        }

        return errors
    }
}
