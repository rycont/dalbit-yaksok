import {
    FFIResultTypeIsNotForYaksokError,
    Token,
    ValueType,
} from '@dalbit-yaksok/core'

export function assertValidReturnValue(
    value: ValueType,
    tokens: Token[],
    name: string | null,
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
