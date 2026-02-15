import { type Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'

export function extractParamNamesFromHeaderTokens(
    allTokens: Token[],
): string[] {
    const linebreakIndex = allTokens.findIndex(
        (token) => token.type === TOKEN_TYPE.NEW_LINE,
    )
    const headerTokens =
        linebreakIndex === -1 ? allTokens : allTokens.slice(0, linebreakIndex)

    const params: string[] = []

    for (let i = 0; i < headerTokens.length - 1; i++) {
        if (headerTokens[i].type !== TOKEN_TYPE.OPENING_PARENTHESIS) {
            continue
        }

        const nextToken = headerTokens[i + 1]
        if (nextToken?.type !== TOKEN_TYPE.IDENTIFIER) {
            continue
        }

        const nextNextToken = headerTokens[i + 2]
        if (nextNextToken?.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            params.push(nextToken.value)
            continue
        }

        if (nextNextToken?.type !== TOKEN_TYPE.COMMA) {
            continue
        }

        let j = i + 1
        while (
            j < headerTokens.length &&
            headerTokens[j]?.type === TOKEN_TYPE.IDENTIFIER
        ) {
            params.push(headerTokens[j].value)

            const after = headerTokens[j + 1]
            if (after?.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
                break
            }
            if (after?.type === TOKEN_TYPE.COMMA) {
                j += 2
            } else {
                break
            }
        }
    }

    return params
}
