import { RESERVED_WORDS } from '../constant/reserved-words.ts'
import { NotProperIdentifierNameToDefineError } from '../error/index.ts'
import type { Token } from '../prepare/tokenize/token.ts'

export function assertValidIdentifierName(value: string, token: Token) {
    if (!RESERVED_WORDS.has(value)) return

    throw new NotProperIdentifierNameToDefineError({
        tokens: [token],
    })
}
