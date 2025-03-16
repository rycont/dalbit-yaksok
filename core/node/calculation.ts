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
    NotEqualOperator,
    OrOperator,
    PlusOperator,
    PowerOperator,
    RangeOperator,
} from './operator.ts'
import { Evaluable, Operator, OperatorClass } from './base.ts'
import { ValueType } from '../value/base.ts'
import type { Token } from '../prepare/tokenize/token.ts'
import {
    InvalidTypeForOperatorError,
    RangeEndMustBeIntegerError,
    RangeStartMustBeIntegerError,
    UnknownOperatorError,
} from '../error/calculation.ts'
import { YaksokError } from '../error/common.ts'
import {
    RangeEndMustBeNumberError,
    RangeStartMustBeNumberError,
} from '../error/index.ts'
import { RangeStartMustBeLessThanEndError } from '../error/indexed.ts'

const OPERATOR_PRECEDENCES: OperatorClass[][] = [
    [AndOperator, OrOperator],
    [
        EqualOperator,
        NotEqualOperator,
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

    override execute(scope: Scope): Promise<ValueType> {
        return this.value.execute(scope)
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

    override async execute(scope: Scope): Promise<ValueType> {
        const termsWithToken = this.terms.map((term) => ({
            value: term,
            tokens: term.tokens,
        }))

        for (
            let currentPrecedence = OPERATOR_PRECEDENCES.length - 1;
            currentPrecedence >= 0;
            currentPrecedence--
        ) {
            await this.calculateOperatorWithPrecedence(
                termsWithToken,
                currentPrecedence,
                scope,
            )
        }

        if (termsWithToken.length !== 1) {
            throw new UnknownOperatorError({
                tokens: this.tokens,
                resource: {
                    operator: termsWithToken[1].value as Operator,
                },
            })
        }

        return termsWithToken[0].value as ValueType
    }

    async calculateOperatorWithPrecedence(
        termsWithToken: {
            value: Evaluable | Operator | ValueType
            tokens: Token[]
        }[],
        precedence: number,
        scope: Scope,
    ) {
        const currentOperators = OPERATOR_PRECEDENCES[precedence]

        for (let i = 0; i < termsWithToken.length; i++) {
            const term = termsWithToken[i].value

            const isOperator = term instanceof Operator
            const isCurrentPrecedence = currentOperators.includes(
                term.constructor as OperatorClass,
            )

            if (!isOperator || !isCurrentPrecedence) continue

            const leftTerm = termsWithToken[i - 1].value as
                | Evaluable
                | ValueType
            const rightTerm = termsWithToken[i + 1].value as
                | Evaluable
                | ValueType

            const left =
                leftTerm instanceof ValueType
                    ? leftTerm
                    : await leftTerm.execute(scope)

            const right =
                rightTerm instanceof ValueType
                    ? rightTerm
                    : await rightTerm.execute(scope)

            const mergedTokens = [
                ...termsWithToken[i - 1].tokens,
                ...term.tokens,
                ...termsWithToken[i + 1].tokens,
            ]

            try {
                const result = term.call(left, right)

                termsWithToken.splice(i - 1, 3, {
                    value: result,
                    tokens: mergedTokens,
                })

                i--
            } catch (e) {
                if (e instanceof YaksokError && !e.tokens) {
                    if (e instanceof InvalidTypeForOperatorError) {
                        e.tokens = mergedTokens
                    } else if (
                        e instanceof RangeStartMustBeNumberError ||
                        e instanceof RangeStartMustBeIntegerError
                    ) {
                        e.tokens = termsWithToken[i - 1].tokens
                    } else if (
                        e instanceof RangeEndMustBeNumberError ||
                        e instanceof RangeEndMustBeIntegerError
                    ) {
                        e.tokens = termsWithToken[i + 1].tokens
                    } else if (e instanceof RangeStartMustBeLessThanEndError) {
                        e.tokens = mergedTokens
                    }
                }

                throw e
            }
        }
    }

    override toPrint(): string {
        return this.terms.map((term) => term.toPrint()).join(' ')
    }
}
