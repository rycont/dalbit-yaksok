import { InvalidTypeForCompareError } from '../error/calculation.ts'
import {
    InvalidTypeForOperatorError,
    RangeEndMustBeIntegerError,
    RangeEndMustBeNumberError,
    RangeStartMustBeIntegerError,
    RangeStartMustBeLessThanEndError,
    RangeStartMustBeNumberError,
    YaksokError,
} from '../error/index.ts'
import { Token } from '../prepare/tokenize/token.ts'

import { PrimitiveValue, ValueType } from '../value/base.ts'
import { ListValue } from '../value/list.ts'
import {
    BooleanValue,
    EmptyValue,
    NumberValue,
    StringValue,
} from '../value/primitive.ts'
import { Operator } from './base.ts'
import { cleanFloatingPointError } from '../util/float-precision.ts'

export class PlusOperator extends Operator {
    static override friendlyName = '더하기(+)'
    static sign = '+'

    constructor(public override tokens: Token[]) {
        super(PlusOperator.sign, tokens)
    }

    override toPrint(): string {
        return '+'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<NumberValue | StringValue | ListValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new NumberValue(
                cleanFloatingPointError(leftValue.value + rightValue.value),
            )
        }

        if (
            leftValue instanceof StringValue &&
            rightValue instanceof StringValue
        ) {
            return new StringValue(leftValue.value + rightValue.value)
        }

        if (
            leftValue instanceof StringValue &&
            rightValue instanceof NumberValue
        ) {
            return new StringValue(
                leftValue.value + rightValue.value.toString(),
            )
        }

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof StringValue
        ) {
            return new StringValue(
                leftValue.value.toString() + rightValue.value,
            )
        }

        if (leftValue instanceof ListValue && rightValue instanceof ListValue) {
            return new ListValue([
                ...Array.from(leftValue.enumerate()),
                ...Array.from(rightValue.enumerate()),
            ])
        }

        throw new InvalidTypeForOperatorError({
            position: this.tokens?.[0].position,
            resource: {
                operator: this,
                operands: [leftValue, rightValue],
            },
        })
    }
}

export class MinusOperator extends Operator {
    static override friendlyName = '빼기(-)'
    static sign = '-'

    constructor(public override tokens: Token[]) {
        super(MinusOperator.sign, tokens)
    }

    override toPrint(): string {
        return '-'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<NumberValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new NumberValue(
                cleanFloatingPointError(leftValue.value - rightValue.value),
            )
        }

        throw new InvalidTypeForOperatorError({
            position: this.tokens?.[0].position,
            resource: {
                operator: this,
                operands: [leftValue, rightValue],
            },
        })
    }
}

export class MultiplyOperator extends Operator {
    static override friendlyName = '곱하기(*)'
    static sign = '*'

    constructor(public override tokens: Token[]) {
        super(MultiplyOperator.sign, tokens)
    }

    override toPrint(): string {
        return '*'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<NumberValue | StringValue | ListValue> {
        const leftValue = await left()
        const rightValue = await right()

        const ensureValidListMultiplier = (value: number): number => {
            if (!Number.isSafeInteger(value) || value < 0) {
                throw new InvalidTypeForOperatorError({
                    position: this.tokens?.[0].position,
                    resource: {
                        operator: this,
                        operands: [leftValue, rightValue],
                    },
                })
            }

            return value
        }

        const repeatList = (list: ListValue, multiplier: number): ListValue => {
            const sourceElements = Array.from(list.enumerate())
            const repeatedElements: ValueType[] = []

            for (let i = 0; i < multiplier; i++) {
                for (const element of sourceElements) {
                    repeatedElements.push(element)
                }
            }

            return new ListValue(repeatedElements)
        }

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new NumberValue(
                cleanFloatingPointError(leftValue.value * rightValue.value),
            )
        }

        if (
            leftValue instanceof StringValue &&
            rightValue instanceof NumberValue
        ) {
            return new StringValue(leftValue.value.repeat(rightValue.value))
        }

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof StringValue
        ) {
            return new StringValue(rightValue.value.repeat(leftValue.value))
        }

        if (
            leftValue instanceof ListValue &&
            rightValue instanceof NumberValue
        ) {
            const multiplier = ensureValidListMultiplier(rightValue.value)
            return repeatList(leftValue, multiplier)
        }

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof ListValue
        ) {
            const multiplier = ensureValidListMultiplier(leftValue.value)
            return repeatList(rightValue, multiplier)
        }

        throw new InvalidTypeForOperatorError({
            position: this.tokens?.[0].position,
            resource: {
                operator: this,
                operands: [leftValue, rightValue],
            },
        })
    }
}

export class DivideOperator extends Operator {
    static override friendlyName = '나누기(/)'
    static sign = '/'

    constructor(public override tokens: Token[]) {
        super(DivideOperator.sign, tokens)
    }

    override toPrint(): string {
        return '/'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<NumberValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new NumberValue(
                cleanFloatingPointError(leftValue.value / rightValue.value),
            )
        }

        throw new InvalidTypeForOperatorError({
            position: this.tokens?.[0].position,
            resource: {
                operator: this,
                operands: [leftValue, rightValue],
            },
        })
    }
}

export class ModularOperator extends Operator {
    static override friendlyName = '나머지(%)'
    static sign = '%'

    constructor(public override tokens: Token[]) {
        super(ModularOperator.sign, tokens)
    }

    override toPrint(): string {
        return '%'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<NumberValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new NumberValue(
                cleanFloatingPointError(leftValue.value % rightValue.value),
            )
        }

        throw new InvalidTypeForOperatorError({
            position: this.tokens?.[0].position,
            resource: {
                operator: this,
                operands: [leftValue, rightValue],
            },
        })
    }
}

export class PowerOperator extends Operator {
    static override friendlyName = '제곱(**)'
    static sign = '**'

    constructor(public override tokens: Token[]) {
        super(PowerOperator.sign, tokens)
    }

    override toPrint(): string {
        return '**'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<NumberValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new NumberValue(
                cleanFloatingPointError(leftValue.value ** rightValue.value),
            )
        }

        throw new InvalidTypeForOperatorError({
            position: this.tokens?.[0].position,
            resource: {
                operator: this,
                operands: [leftValue, rightValue],
            },
        })
    }
}

export class IntegerDivideOperator extends Operator {
    static override friendlyName = '정수 나누기(//)'
    static sign = '//'

    constructor(public override tokens: Token[]) {
        super(IntegerDivideOperator.sign, tokens)
    }

    override toPrint(): string {
        return '//'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<NumberValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new NumberValue(
                Math.floor(leftValue.value / rightValue.value),
            )
        }

        throw new InvalidTypeForOperatorError({
            position: this.tokens?.[0].position,
            resource: {
                operator: this,
                operands: [leftValue, rightValue],
            },
        })
    }
}

export class EqualOperator extends Operator {
    static override friendlyName = '같다(==)'
    static sign = '=='

    constructor(public override tokens: Token[]) {
        super(EqualOperator.sign, tokens)
    }

    override toPrint(): string {
        return '=='
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        try {
            const result = await EqualOperator.isEqual(left, right)
            return new BooleanValue(result)
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }

    public static async isEqual(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<boolean> {
        const leftValue = await left()
        const rightValue = await right()

        const isSameType = leftValue.constructor === rightValue.constructor
        const isBothPrimitive =
            leftValue instanceof PrimitiveValue &&
            rightValue instanceof PrimitiveValue

        const isBiasedEmpty =
            leftValue instanceof EmptyValue !== rightValue instanceof EmptyValue

        if (isBiasedEmpty) {
            return false
        }

        if (!isSameType || !isBothPrimitive) {
            throw new InvalidTypeForCompareError({
                resource: {
                    left: leftValue,
                    right: rightValue,
                },
            })
        }

        return leftValue.value === rightValue.value
    }
}

export class NotEqualOperator extends Operator {
    static override friendlyName = '같지 않다(!=)'
    static sign = '!='

    constructor(public override tokens: Token[]) {
        super(NotEqualOperator.sign, tokens)
    }

    override toPrint(): string {
        return '!='
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        try {
            const result = await EqualOperator.isEqual(left, right)
            return new BooleanValue(!result)
        } catch (e) {
            if (e instanceof YaksokError && !e.tokens) {
                e.tokens = this.tokens
            }

            throw e
        }
    }
}

export class AndOperator extends Operator {
    static override friendlyName = '이고'
    static sign = '이고'

    constructor(public override tokens: Token[]) {
        super(AndOperator.sign, tokens)
    }

    override toPrint(): string {
        return '이고'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        const leftValue = await left()

        if (!(leftValue instanceof BooleanValue)) {
            throw new InvalidTypeForOperatorError({
                position: this.tokens?.[0].position,
                resource: {
                    operator: this,
                    operands: [leftValue],
                },
            })
        }

        if (!leftValue.value) return new BooleanValue(false)

        const rightValue = await right()

        if (!(rightValue instanceof BooleanValue)) {
            throw new InvalidTypeForOperatorError({
                position: this.tokens?.[0].position,
                resource: {
                    operator: this,
                    operands: [leftValue, rightValue],
                },
            })
        }

        return new BooleanValue(rightValue.value)
    }
}

export class OrOperator extends Operator {
    static override friendlyName = '이거나(거나)'
    static sign = '이거나(거나)'

    constructor(public override tokens: Token[]) {
        super(OrOperator.sign, tokens)
    }

    override toPrint(): string {
        return '이거나(거나)'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        const leftValue = await left()

        if (!(leftValue instanceof BooleanValue)) {
            throw new InvalidTypeForOperatorError({
                position: this.tokens?.[0].position,
                resource: {
                    operator: this,
                    operands: [leftValue],
                },
            })
        }

        if (leftValue.value) return new BooleanValue(true)

        const rightValue = await right()

        if (!(rightValue instanceof BooleanValue)) {
            throw new InvalidTypeForOperatorError({
                position: this.tokens?.[0].position,
                resource: {
                    operator: this,
                    operands: [leftValue, rightValue],
                },
            })
        }

        return new BooleanValue(rightValue.value)
    }
}

export class GreaterThanOperator extends Operator {
    static override friendlyName = '크다(>)'
    static sign = '>'

    constructor(public override tokens: Token[]) {
        super(GreaterThanOperator.sign, tokens)
    }

    override toPrint(): string {
        return '>'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new BooleanValue(leftValue.value > rightValue.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.tokens?.[0].position,
            resource: {
                left: leftValue,
                right: rightValue,
            },
        })
    }
}

export class LessThanOperator extends Operator {
    static override friendlyName = '작다(<)'
    static sign = '<'

    constructor(public override tokens: Token[]) {
        super(LessThanOperator.sign, tokens)
    }

    override toPrint(): string {
        return '<'
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new BooleanValue(leftValue.value < rightValue.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.tokens?.[0].position,
            resource: {
                left: leftValue,
                right: rightValue,
            },
        })
    }
}

export class GreaterThanOrEqualOperator extends Operator {
    static override friendlyName = '크거나 같다(>=)'
    static sign = '>='

    constructor(public override tokens: Token[]) {
        super(GreaterThanOrEqualOperator.sign, tokens)
    }

    override toPrint(): string {
        return '>='
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new BooleanValue(leftValue.value >= rightValue.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.tokens?.[0].position,
            resource: {
                left: leftValue,
                right: rightValue,
            },
        })
    }
}

export class LessThanOrEqualOperator extends Operator {
    static override friendlyName = '작거나 같다(<=)'
    static sign = '<='

    constructor(public override tokens: Token[]) {
        super(LessThanOrEqualOperator.sign, tokens)
    }

    override toPrint(): string {
        return '<='
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<BooleanValue> {
        const leftValue = await left()
        const rightValue = await right()

        if (
            leftValue instanceof NumberValue &&
            rightValue instanceof NumberValue
        ) {
            return new BooleanValue(leftValue.value <= rightValue.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.tokens?.[0].position,
            resource: {
                left: leftValue,
                right: rightValue,
            },
        })
    }
}

export class RangeOperator extends Operator {
    static override friendlyName = '범위에서 목록 만들기(~)'
    static sign = '~'

    constructor(public override tokens: Token[]) {
        super(RangeOperator.sign, tokens)
    }

    override toPrint(): string {
        return RangeOperator.sign
    }

    override async call(
        left: () => Promise<ValueType>,
        right: () => Promise<ValueType>,
    ): Promise<ListValue> {
        const leftValue = await left()
        const rightValue = await right()

        this.assertProperOperands([leftValue, rightValue])

        const [start, end] = [leftValue, rightValue] as [
            NumberValue,
            NumberValue,
        ]
        const roundedStart = Math.round(start.value)
        const roundedEnd = Math.round(end.value)
        const items = Array.from(
            { length: roundedEnd - roundedStart + 1 },
            (_, index) => new NumberValue(roundedStart + index),
        )

        return new ListValue(items)
    }

    private assertProperOperands(
        operands: ValueType[],
    ): asserts operands is [NumberValue, NumberValue] {
        const [start, end] = operands
        this.assertProperStartType(start)
        this.assertProperEndType(end)

        this.assertRangeStartLessThanEnd(start.value, end.value)
    }

    private assertProperStartType(
        start: ValueType,
    ): asserts start is NumberValue {
        if (!(start instanceof NumberValue)) {
            throw new RangeStartMustBeNumberError({
                resource: {
                    start,
                },
            })
        }

        if (!Number.isInteger(start.value)) {
            throw new RangeStartMustBeIntegerError({
                resource: {
                    start,
                },
            })
        }
    }

    private assertProperEndType(end: ValueType): asserts end is NumberValue {
        if (!(end instanceof NumberValue)) {
            throw new RangeEndMustBeNumberError({
                resource: {
                    end,
                },
            })
        }

        if (!Number.isInteger(end.value)) {
            throw new RangeEndMustBeIntegerError({
                resource: {
                    end,
                },
            })
        }
    }

    private assertRangeStartLessThanEnd(start: number, end: number) {
        if (start <= end) return

        throw new RangeStartMustBeLessThanEndError({
            position: this.tokens[0].position,
            resource: {
                start,
                end,
            },
        })
    }
}

export const assignerToOperatorMap = {
    '+=': PlusOperator,
    '-=': MinusOperator,
    '*=': MultiplyOperator,
    '/=': DivideOperator,
    '%=': ModularOperator,
} as const
