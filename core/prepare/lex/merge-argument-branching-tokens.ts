import { Token, TOKEN_TYPE } from '../tokenize/token.ts'

export function mergeArgumentBranchingTokens(
    _tokens: Token[],
    functionDeclareRanges: [number, number][],
) {
    const tokens: (Token | null)[] = [..._tokens]

    for (const [start, end] of functionDeclareRanges) {
        for (let cursor = start; cursor < end; cursor++) {
            const currentToken = tokens[cursor]
            if (!currentToken) continue

            const isCurrentSlash = isSlash(currentToken)
            if (!isCurrentSlash) continue

            const mergingEndIndex = getMergingEndIndex(tokens, cursor, end)
            const mergingTokens = tokens.slice(cursor - 1, mergingEndIndex)
            const mergedString = getMergedSlashedNames(mergingTokens)

            const prevToken = tokens[cursor - 1]!
            prevToken.value = mergedString

            for (let i = cursor; i < mergingEndIndex; i++) {
                tokens[i] = null
            }
        }
    }

    const filteredTokens = tokens.filter(Boolean) as Token[]
    return filteredTokens
}

function isSlash(token: Token) {
    return token.type === TOKEN_TYPE.OPERATOR && token.value === '/'
}

function getMergingEndIndex(
    tokens: (Token | null)[],
    startIndex: number,
    functionHeaderEndIndex: number,
) {
    let endIndex = startIndex

    for (; endIndex < functionHeaderEndIndex; endIndex++) {
        const currentToken = tokens[endIndex]
        if (!currentToken) continue

        const isValidTokenTypes =
            currentToken.type === TOKEN_TYPE.OPERATOR ||
            currentToken.type === TOKEN_TYPE.IDENTIFIER

        if (!isValidTokenTypes) {
            break
        }
    }

    return endIndex
}

function getMergedSlashedNames(tokens: (Token | null)[]) {
    return tokens.map((token) => (token ? token.value : '')).join('')
}
