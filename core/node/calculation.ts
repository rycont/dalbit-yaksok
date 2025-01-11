import { CallFrame } from '../executer/callFrame.ts'
import type { Scope } from '../executer/scope.ts'
import {
    AndOperator,
    DivideOperator,
    EqualOperator,
    GreaterThanOperator,
    GreaterThanOrEqualOperator,
    IntegerDivideOperator,
    LessThanOperator,
    LessThanOrEqualOperator,
    MinusOperator,
    ModularOperator,
    MultiplyOperator,
    OrOperator,
    PlusOperator,
    PowerOperator,
    RangeOperator,
} from './operator.ts'
import { Evaluable, Operator, OperatorClass } from './base.ts'
import { ValueType } from '../value/base.ts'
import type { Token } from '../prepare/tokenize/token.ts'

const OPERATOR_PRECEDENCES: OperatorClass[][] = [
    [AndOperator, OrOperator],
    [
        EqualOperator,
        LessThanOperator,
        GreaterThanOperator,
        LessThanOrEqualOperator,
        GreaterThanOrEqualOperator,
        RangeOperator,
    ],
    [MinusOperator, PlusOperator],
    [MultiplyOperator, DivideOperator, ModularOperator, IntegerDivideOperator],
    [PowerOperator],
]

export class ValueWithParenthesis extends Evaluable {
    static override friendlyName = '괄호로 묶인 값'

    constructor(public value: Evaluable, public override tokens: Token[]) {
        super()
    }

    override execute(scope: Scope, _callFrame: CallFrame): Promise<ValueType> {
        const callFrame = new CallFrame(this, _callFrame)
        return this.value.execute(scope, callFrame)
    }

    override toPrint(): string {
        return '(' + this.value.toPrint() + ')'
    }
}

export class Formula extends Evaluable {
    static override friendlyName = '계산식'

    constructor(
        public terms: (Evaluable | Operator)[],
        public override tokens: Token[],
    ) {
        super()
    }

    override async execute(
        scope: Scope,
        _callFrame: CallFrame,
    ): Promise<ValueType> {
        const callFrame = new CallFrame(this, _callFrame)
        const terms = [...this.terms]

        for (
            let currentPrecedence = OPERATOR_PRECEDENCES.length - 1;
            currentPrecedence >= 0;
            currentPrecedence--
        ) {
            await this.calculateOperatorWithPrecedence(
                terms,
                currentPrecedence,
                scope,
                callFrame,
            )
        }

        return terms[0] as ValueType
    }

    async calculateOperatorWithPrecedence(
        terms: (Evaluable | Operator | ValueType)[],
        precedence: number,
        scope: Scope,
        callFrame: CallFrame,
    ) {
        const currentOperators = OPERATOR_PRECEDENCES[precedence]

        for (let i = 0; i < terms.length; i++) {
            const term = terms[i]

            const isOperator = term instanceof Operator
            const isCurrentPrecedence = currentOperators.includes(
                term.constructor as OperatorClass,
            )

            if (!isOperator || !isCurrentPrecedence) continue

            const leftTerm = terms[i - 1] as Evaluable | ValueType
            const rightTerm = terms[i + 1] as Evaluable | ValueType

            const left =
                leftTerm instanceof ValueType
                    ? leftTerm
                    : await leftTerm.execute(scope, callFrame)

            const right =
                rightTerm instanceof ValueType
                    ? rightTerm
                    : await rightTerm.execute(scope, callFrame)

            const result = term.call(left, right)
            terms.splice(i - 1, 3, result)

            i--
        }
    }

    override toPrint(): string {
        return this.terms.map((term) => term.toPrint()).join(' ')
    }
}
