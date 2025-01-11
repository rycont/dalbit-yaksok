import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { SCOPE } from './scope.ts'

export function parseFunctionDeclareHeader(tokens: Token[]) {
    const newLineIndex = tokens.findIndex(
        (token) => token.type === TOKEN_TYPE.NEW_LINE,
    )

    const functionHeader = tokens.slice(2, newLineIndex)

    const colorParts = functionHeader.map((token, index) => {
        const prevToken = functionHeader[index - 1]

        if (prevToken?.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            return {
                position: token.position,
                scopes: SCOPE.VARIABLE_NAME,
            }
        }

        if (token.type === TOKEN_TYPE.IDENTIFIER) {
            return {
                position: token.position,
                scopes: SCOPE.CALLABLE,
            }
        }

        return {
            position: token.position,
            scopes: SCOPE.PARENTHESIS,
        }
    })

    const fixedPart = [
        {
            position: tokens[0].position,
            scopes: SCOPE.KEYWORD,
        },
        {
            position: tokens[1].position,
            scopes: SCOPE.PUNCTUATION,
        },
    ]

    return fixedPart.concat(colorParts)
}
