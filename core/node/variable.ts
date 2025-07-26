import { YaksokError } from '../error/common.ts'
import { Evaluable } from './base.ts'

import { RESERVED_WORDS } from '../constant/reserved-words.ts'
import { CannotUseReservedWordForIdentifierNameError } from '../error/index.ts'
import type { Scope } from '../executer/scope.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import type { ValueType } from '../value/base.ts'
import { NumberValue } from '../value/primitive.ts'
import {
    DivideOperator,
    MinusOperator,
    ModularOperator,
    MultiplyOperator,
    PlusOperator,
} from './operator.ts'

const operatorToNodeMap = {
    '+=': PlusOperator,
    '-=': MinusOperator,
    '*=': MultiplyOperator,
    '/=': DivideOperator,
    '%=': ModularOperator,
} as const

export class SetVariable extends Evaluable {
    static override friendlyName = '변수 정하기'

    constructor(
        public name: string,
        public value: Evaluable,
        public override tokens: Token[],
        public operator: string,
    ) {
        super()
        this.assertValidName()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        const { name, value } = this

        const operatorNode =
            operatorToNodeMap[this.operator as keyof typeof operatorToNodeMap]

        const operand = await value.execute(scope)

        let newValue = operand

        if (operatorNode) {
            const oldValue = scope.getVariable(name)
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

        scope.setVariable(name, newValue)
        return newValue
    }

    assertValidName() {
        if (!RESERVED_WORDS.has(this.name)) return

        throw new CannotUseReservedWordForIdentifierNameError({
            tokens: this.tokens,
        })
    }

    override validate(scope: Scope): YaksokError[] {
        const errors = this.value.validate(scope)
        scope.setVariable(this.name, new NumberValue(0))

        return errors
    }
}
