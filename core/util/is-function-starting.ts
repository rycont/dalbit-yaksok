import { Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'

export function isYaksokStartingPattern(
    index: number,
    allTokens: Token[],
): boolean {
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

export function isFfiStartingPattern(
    index: number,
    allTokens: Token[],
): boolean {
    if (index < 5) {
        return false
    }

    const first5Tokens = []

    for (let i = index - 5; i < allTokens.length; i++) {
        if (first5Tokens.length === 5) {
            break
        }

        if (allTokens[i].type === TOKEN_TYPE.SPACE) {
            continue
        }

        first5Tokens.push(allTokens[i])
    }

    if (first5Tokens.length < 5) {
        return false
    }

    const first = first5Tokens.shift()!

    if (first.type !== TOKEN_TYPE.IDENTIFIER) return false
    if (first.value !== '번역') return false

    const second = first5Tokens.shift()!
    if (second.type !== TOKEN_TYPE.OPENING_PARENTHESIS) return false

    const third = first5Tokens.shift()!
    if (third.type !== TOKEN_TYPE.IDENTIFIER) return false

    const fourth = first5Tokens.shift()!
    if (fourth.type !== TOKEN_TYPE.CLOSING_PARENTHESIS) return false

    const fifth = first5Tokens.shift()!
    return fifth.type === TOKEN_TYPE.COMMA
}
