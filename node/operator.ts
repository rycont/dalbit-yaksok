import { InvalidTypeForCompareError } from '../error/calculation.ts'
import { InvalidTypeForOperatorError } from '../error/index.ts'
import { Operator, type ValueTypes } from './base.ts'
import {
    BooleanValue,
    NumberValue,
    PrimitiveValue,
    StringValue,
} from './primitive.ts'

export class PlusOperator extends Operator {
    override toPrint() {
        return '+'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new NumberValue(left.value + right.value)
        }

        if (left instanceof StringValue && right instanceof StringValue) {
            return new StringValue(left.value + right.value)
        }

        if (left instanceof StringValue && right instanceof NumberValue) {
            return new StringValue(left.value + right.value.toString())
        }

        if (left instanceof NumberValue && right instanceof StringValue) {
            return new StringValue(left.value.toString() + right.value)
        }

        throw new InvalidTypeForOperatorError({
            position: this.position,
            resource: {
                operator: this,
                operands,
            },
        })
    }
}

export class MinusOperator extends Operator {
    override toPrint() {
        return '-'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands
        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new NumberValue(left.value - right.value)
        }

        throw new InvalidTypeForOperatorError({
            position: this.position,
            resource: {
                operator: this,
                operands,
            },
        })
    }
}

export class MultiplyOperator extends Operator {
    override toPrint() {
        return '*'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands
        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new NumberValue(left.value * right.value)
        }

        if (left instanceof StringValue && right instanceof NumberValue) {
            return new StringValue(left.value.repeat(right.value))
        }

        if (left instanceof NumberValue && right instanceof StringValue) {
            return new StringValue(right.value.repeat(left.value))
        }

        throw new InvalidTypeForOperatorError({
            position: this.position,
            resource: {
                operator: this,
                operands,
            },
        })
    }
}

export class DivideOperator extends Operator {
    override toPrint() {
        return '/'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new NumberValue(left.value / right.value)
        }

        throw new InvalidTypeForOperatorError({
            position: this.position,
            resource: {
                operator: this,
                operands,
            },
        })
    }
}

export class ModularOperator extends Operator {
    override toPrint() {
        return '%'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new NumberValue(left.value % right.value)
        }

        throw new InvalidTypeForOperatorError({
            position: this.position,
            resource: {
                operator: this,
                operands,
            },
        })
    }
}
export class PowerOperator extends Operator {
    override toPrint() {
        return '**'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new NumberValue(left.value ** right.value)
        }

        throw new InvalidTypeForOperatorError({
            position: this.position,
            resource: {
                operator: this,
                operands,
            },
        })
    }
}
export class IntegerDivideOperator extends Operator {
    override toPrint() {
        return '//'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new NumberValue(Math.floor(left.value / right.value))
        }

        throw new InvalidTypeForOperatorError({
            position: this.position,
            resource: {
                operator: this,
                operands,
            },
        })
    }
}

export class EqualOperator extends Operator {
    override toPrint() {
        return '='
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof PrimitiveValue && right instanceof PrimitiveValue) {
            return new BooleanValue(left.value === right.value)
        }

        throw new Error(
            "Evaluation equality between non-primitive values isn't supported yet.",
        )
    }
}

export class AndOperator extends Operator {
    override toPrint() {
        return '이고(그리고)'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (
            !(left instanceof BooleanValue) ||
            !(right instanceof BooleanValue)
        ) {
            throw new InvalidTypeForOperatorError({
                position: this.position,
                resource: {
                    operator: this,
                    operands,
                },
            })
        }

        return new BooleanValue(left.value && right.value)
    }
}

export class OrOperator extends Operator {
    override toPrint() {
        return '이거나(거나)'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (
            !(left instanceof BooleanValue) ||
            !(right instanceof BooleanValue)
        ) {
            throw new InvalidTypeForOperatorError({
                position: this.position,
                resource: {
                    operator: this,
                    operands,
                },
            })
        }

        return new BooleanValue(left.value || right.value)
    }
}

export class GreaterThanOperator extends Operator {
    override toPrint() {
        return '>'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new BooleanValue(left.value > right.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.position,
            resource: {
                left,
                right,
            },
        })
    }
}

export class LessThanOperator extends Operator {
    override toPrint() {
        return '<'
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new BooleanValue(left.value < right.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.position,
            resource: {
                left,
                right,
            },
        })
    }
}

export class GreaterThanOrEqualOperator extends Operator {
    override toPrint() {
        return '>='
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new BooleanValue(left.value >= right.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.position,
            resource: {
                left,
                right,
            },
        })
    }
}

export class LessThanOrEqualOperator extends Operator {
    override toPrint() {
        return '<='
    }

    override call(...operands: ValueTypes[]) {
        const [left, right] = operands

        if (left instanceof NumberValue && right instanceof NumberValue) {
            return new BooleanValue(left.value <= right.value)
        }

        throw new InvalidTypeForCompareError({
            position: this.position,
            resource: {
                left,
                right,
            },
        })
    }
}
