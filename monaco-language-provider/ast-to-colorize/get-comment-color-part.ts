import { TOKEN_TYPE, type Token } from '@dalbit-yaksok/core'
import { ColorPart } from '../type.ts'
import { SCOPE } from './scope.ts'

export function getCommentColorParts(tokens: Token[]): ColorPart[] {
    const commentTokens = tokens.filter(
        (token) => token.type === TOKEN_TYPE.LINE_COMMENT,
    )

    const colorParts = commentTokens.map((token) => ({
        position: token.position,
        scopes: SCOPE.COMMENT,
    }))

    return colorParts
}
