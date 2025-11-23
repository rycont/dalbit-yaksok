import { YaksokError } from '../error/common.ts'
import { Scope } from '../executer/scope.ts'
import { Token } from '../prepare/tokenize/token.ts'
import { ValueType } from '../value/base.ts'
import { BooleanValue } from '../value/primitive.ts'
import { Evaluable, Operator } from './base.ts'
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
import {
    FormulaStackUnderflowError,
    InvalidFormulaError,
    NotBooleanTypeError,
} from '../error/calculation.ts'

export class ValueWithParenthesis extends Evaluable {
    static override friendlyName = '괄호로 묶인 값'

    constructor(public value: Evaluable, public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope): Promise<ValueType> {
        return await this.value.execute(scope)
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
    }
}

export class NotExpression extends Evaluable {
    static override friendlyName = '부정'

    constructor(public value: Evaluable, public override tokens: Token[]) {
        super()
    }

    override async execute(scope: Scope): Promise<BooleanValue> {
        const value = await this.value.execute(scope)

        if (!(value instanceof BooleanValue)) {
            throw new NotBooleanTypeError({
                resource: {
                    value,
                },
                tokens: this.tokens,
            })
        }

        return new BooleanValue(!value.value)
    }

    override validate(scope: Scope): YaksokError[] {
        return this.value.validate(scope)
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
        const rpn = this.toRPN()
        const stack: { value: ValueType; tokens: Token[] }[] = []

        for (const item of rpn) {
            if (item instanceof Operator) {
                const right = stack.pop()
                const left = stack.pop()

                if (!left || !right) {
                    throw new FormulaStackUnderflowError({
                        resource: {
                            formula: this,
                        },
                        tokens: this.tokens,
                    })
                }

                const combinedTokens = [
                    ...left.tokens,
                    ...item.tokens,
                    ...right.tokens,
                ]

                await this.onRunChild({
                    scope,
                    childTokens: combinedTokens,
                })

                const result = item.call(left.value, right.value)
                stack.push({ value: result, tokens: combinedTokens })
            } else {
                await this.onRunChild({
                    scope,
                    childTokens: item.tokens,
                })

                const result = await item.execute(scope)
                stack.push({ value: result, tokens: item.tokens })
            }
        }

        if (stack.length !== 1) {
            throw new InvalidFormulaError({
                resource: {
                    formula: this,
                },
                tokens: this.tokens,
            })
        }

        return stack[0].value
    }

    override validate(scope: Scope): YaksokError[] {
        return this.terms
            .filter((term) => term instanceof Evaluable)
            .flatMap((term) => (term as Evaluable).validate(scope))
    }

    private toRPN(): (Evaluable | Operator)[] {
        const outputQueue: (Evaluable | Operator)[] = []
        const operatorStack: Operator[] = []

        for (const term of this.terms) {
            if (term instanceof Operator) {
                while (
                    operatorStack.length > 0 &&
                    this.shouldPopOperator(term, operatorStack[operatorStack.length - 1])
                ) {
                    outputQueue.push(operatorStack.pop()!)
                }
                operatorStack.push(term)
            } else {
                outputQueue.push(term)
            }
        }

        while (operatorStack.length > 0) {
            outputQueue.push(operatorStack.pop()!)
        }

        return outputQueue
    }

    private shouldPopOperator(current: Operator, top: Operator): boolean {
        const currentPrecedence = this.getPrecedence(current)
        const topPrecedence = this.getPrecedence(top)

        if (current instanceof PowerOperator) {
            // Right associative: pop only if top has GREATER precedence
            return topPrecedence > currentPrecedence
        }

        // Left associative: pop if top has GREATER OR EQUAL precedence
        return topPrecedence >= currentPrecedence
    }

    private getPrecedence(operator: Operator): number {
        if (operator instanceof PowerOperator) return 5
        if (
            operator instanceof MultiplyOperator ||
            operator instanceof DivideOperator ||
            operator instanceof IntegerDivideOperator ||
            operator instanceof ModularOperator
        )
            return 4
        if (operator instanceof PlusOperator || operator instanceof MinusOperator)
            return 3
        if (
            operator instanceof GreaterThanOperator ||
            operator instanceof LessThanOperator ||
            operator instanceof GreaterThanOrEqualOperator ||
            operator instanceof LessThanOrEqualOperator ||
            operator instanceof EqualOperator ||
            operator instanceof NotEqualOperator ||
            operator instanceof RangeOperator
        )
            return 2
        if (operator instanceof AndOperator) return 1
        if (operator instanceof OrOperator) return 0

        return -1
    }
}
