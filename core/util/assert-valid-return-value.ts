import { FFIResultTypeIsNotForYaksokError } from '../error/ffi.ts'
import type { Identifier } from '../node/base.ts'
import type { FunctionInvoke } from '../node/function.ts'
import { ValueType } from '../value/base.ts'

export function assertValidReturnValue(
    node: FunctionInvoke | Identifier,
    value: ValueType,
) {
    if (value instanceof ValueType) {
        return
    }

    const ffiName = node.value

    throw new FFIResultTypeIsNotForYaksokError({
        ffiName,
        value,
        tokens: node.tokens,
    })
}
