import { FFIResultTypeIsNotForYaksokError } from '../error/ffi.ts'

import { Token } from '../prepare/tokenize/token.ts'
import { ValueType } from '../value/base.ts'

export function assertValidReturnValue(
    value: ValueType,
    tokens: Token[],
    name: string,
) {
    if (value instanceof ValueType) {
        return
    }

    throw new FFIResultTypeIsNotForYaksokError({
        ffiName: name,
        value,
        tokens,
    })
}
