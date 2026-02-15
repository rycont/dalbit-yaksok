import { YaksokError } from '../error/common.ts'
import { Evaluable } from './base.ts'

import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import { NumberValue } from '../value/primitive.ts'
import { assignerToOperatorMap } from './operator.ts'
import { assertValidIdentifierName } from '../util/assert-valid-identifier-name.ts'
import {
    ClassValue,
    createValidationInstanceFromClass,
    NewInstance,
} from './class.ts'

export class SetVariable extends Evaluable {
    static override friendlyName = '변수 정하기'
    public readonly __kind = 'SetVariable' as const

    constructor(
        public name: string,
        public value: Evaluable,
        public override tokens: Token[],
        public operator: string,
    ) {
        super()
        assertValidIdentifierName(name, tokens[0])
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const { name, value } = this

        const operatorNode =
            assignerToOperatorMap[
                this.operator as keyof typeof assignerToOperatorMap
            ]

        const operand = await value.execute(scope)

        let newValue = operand

        if (operatorNode) {
            const oldValue = scope.getVariable(name, this.tokens)
            const tempOperator = new operatorNode(this.tokens)
            try {
                newValue = tempOperator.call(oldValue, operand)
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
        const errors = this.value.validate(scope)
        scope.setVariable(this.name, inferValidationValue(this.value, scope))

        return errors
    }
}

function inferValidationValue(value: Evaluable, scope: Scope): ValueType {
    if (value instanceof NewInstance) {
        try {
            const classValue = scope.getVariable(value.className, value.tokens)
            if (classValue instanceof ClassValue) {
                return createValidationInstanceFromClass(
                    classValue,
                    value.arguments_.length,
                )
            }
        } catch {
            // Ignore lookup errors and fall back to unknown numeric placeholder.
        }
    }

    return new NumberValue(0)
}
