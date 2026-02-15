import { Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'

export function isYaksokStartingPattern(
    _: Token,
    index: number,
    allTokens: Token[],
) {
    const prevPrevToken = allTokens[index - 2]
    const prevToken = allTokens[index - 1]

    if (!prevPrevToken || !prevToken) return false

    const isPrevPrevTokenYaksokKeyword =
        prevPrevToken.type === TOKEN_TYPE.IDENTIFIER &&
        prevPrevToken.value === '약속'

    if (!isPrevPrevTokenYaksokKeyword) return false

    const isPrevTokenComma = prevToken.type === TOKEN_TYPE.COMMA

    return isPrevTokenComma
}

export function isClassStartingPattern(
    _: Token,
    index: number,
    allTokens: Token[],
) {
    const prevPrevToken = allTokens[index - 2]
    const prevToken = allTokens[index - 1]

    if (!prevPrevToken || !prevToken) return false

    const isPrevPrevTokenClassKeyword =
        prevPrevToken.type === TOKEN_TYPE.IDENTIFIER &&
        prevPrevToken.value === '클래스'

    if (!isPrevPrevTokenClassKeyword) return false

    const isPrevTokenComma = prevToken.type === TOKEN_TYPE.COMMA

    return isPrevTokenComma
}

export function isFfiStartingPattern(
    _: Token,
    index: number,
    allTokens: Token[],
) {
    const prev5Tokens = allTokens
        .slice(index - 5)
        .filter((token) => token.type !== TOKEN_TYPE.SPACE)
    if (prev5Tokens.length < 5) return false

    function shift() {
        const shifted = prev5Tokens.shift()!
        return shifted
    }

    const first = shift()!
    if (first.type !== TOKEN_TYPE.IDENTIFIER) return false
    if (first.value !== '번역') return false

    const second = shift()!
    if (second.type !== TOKEN_TYPE.OPENING_PARENTHESIS) return false

    const third = shift()!
    if (third.type !== TOKEN_TYPE.IDENTIFIER) return false

    const fourth = shift()!
    if (fourth.type !== TOKEN_TYPE.CLOSING_PARENTHESIS) return false

    const fifth = shift()!
    return fifth?.type === TOKEN_TYPE.COMMA
}
