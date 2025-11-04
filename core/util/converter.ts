import { ValueType } from '../value/base.ts'
import { IndexedValue } from '../value/indexed.ts'
import { ListValue } from '../value/list.ts'
import { BooleanValue, NumberValue, StringValue } from '../value/primitive.ts'
import { ReferenceStore } from '../value/python.ts'

/**
 * Dalbit `ValueType`을 JavaScript 의 `unknown` 형으로 변환합니다.
 *
 * @param value 변환할 Dalbit `ValueType`
 * @returns JavaScript 의 `unknown` 형
 */
export const dalbitToJS = (value: ValueType): unknown => {
    if (value instanceof StringValue) {
        return value.value
    }

    if (value instanceof NumberValue) {
        return value.value
    }

    if (value instanceof BooleanValue) {
        return value.value
    }

    if (value instanceof ListValue) {
        const jsArray: unknown[] = []
        for (const item of value.enumerate()) {
            jsArray.push(dalbitToJS(item))
        }
        return jsArray
    }

    if (value instanceof IndexedValue) {
        const jsObject: Record<string | number, unknown> = {}
        for (const [key, val] of value.getEntries()) {
            jsObject[key] = dalbitToJS(val)
        }
        return jsObject
    }

    if (value instanceof ReferenceStore) {
        return value.ref
    }

    return value
}

export const jsToDalbit = (value: unknown): ValueType => {
    if (value instanceof ValueType) {
        return value
    }

    if (typeof value === 'string') {
        return new StringValue(value)
    }

    if (typeof value === 'number') {
        return new NumberValue(value)
    }

    if (typeof value === 'boolean') {
        return new BooleanValue(value)
    }

    if (Array.isArray(value)) {
        return new ListValue(value.map((item) => jsToDalbit(item)))
    }

    if (value instanceof Map) {
        const converted = tryConvertMapToIndexedValue(value)
        if (converted) {
            return converted
        }
    }

    if (isPlainRecord(value)) {
        return tryConvertObjectToIndexedValue(value)
    }

    return new ReferenceStore(value)
}

function isPlainRecord(
    value: unknown,
): value is Record<string | number, unknown> {
    if (!value || typeof value !== 'object') {
        return false
    }

    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

function tryConvertMapToIndexedValue(
    map: Map<unknown, unknown>,
): IndexedValue | null {
    const entries = new Map<string | number, ValueType>()

    for (const [key, val] of map.entries()) {
        if (typeof key === 'string' || typeof key === 'number') {
            entries.set(key, jsToDalbit(val))
            continue
        }

        return null
    }

    return new IndexedValue(entries)
}

function tryConvertObjectToIndexedValue(
    value: Record<string | number, unknown>,
): IndexedValue {
    const entries = new Map<string | number, ValueType>()

    for (const [key, val] of Object.entries(value)) {
        entries.set(key, jsToDalbit(val))
    }

    return new IndexedValue(entries)
}
