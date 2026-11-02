import {
    BooleanValue,
    NumberValue,
    StringValue,
    ValueType,
} from '@dalbit-yaksok/core'

export function isTruthy(value: ValueType) {
    if (value instanceof BooleanValue) {
        return value.value
    }

    if (value instanceof NumberValue) {
        return value.value !== 0
    }

    if (value instanceof StringValue) {
        return value.value !== ''
    }

    return !!value
}
