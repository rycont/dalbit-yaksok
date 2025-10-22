import {
    BooleanValue,
    IndexedValue,
    ListValue,
    NumberValue,
    StringValue,
    ValueType,
} from '../mod.ts'

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

    return value
}
