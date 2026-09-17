import { YaksokError } from '../error/common.ts'
import { Evaluable } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import { NumberValue } from '../value/primitive.ts'
import { assignerToOperatorMap } from './operator.ts'
import { assertValidIdentifierName } from '../util/assert-valid-identifier-name.ts'

export class SetVariable extends Evaluable<Evaluable> {
    static override friendlyName = '변수 정하기'
    public readonly __kind = 'SetVariable' as const

    constructor(
        public name: string,
        evaluator: Evaluable,
        public override tokens: Token[],
        public operator: string,
    ) {
        super()
        assertValidIdentifierName(name, tokens[0])
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

                    if (!error.codeFile) {
                        error.codeFile = scope.codeFile
                    }
                }

                throw error
            }
        }

        scope.setVariable(name, newValue, this.tokens)
        return newValue
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.subnode.validate(scope)
        scope.setLocalVariable(this.name, new NumberValue(0))

        return errors
    }
}
