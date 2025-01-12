import {
    IndentIsNotMultipleOf4Error,
    IndentLevelMismatchError,
} from '../../error/prepare.ts'
import { Token, TOKEN_TYPE } from '../tokenize/token.ts'

export function assertIndentValidity(_tokens: Token[]) {
    const tokens = trimTokens(_tokens)

    if (tokens.length === 0) {
        return
    }

    let currentDepth = 0

    const isStartsWithSpaces = [TOKEN_TYPE.INDENT, TOKEN_TYPE.SPACE].includes(
        tokens[0].type,
    )

    if (isStartsWithSpaces) {
        throw new IndentLevelMismatchError({
            resource: {
                expected: 0,
            },
            tokens: [tokens[0]],
        })
    }

    for (const [index, token] of tokens.entries()) {
        if (token.type !== TOKEN_TYPE.NEW_LINE) {
            continue
        }

        const nextToken = tokens[index + 1]

        if (nextToken && nextToken.type === TOKEN_TYPE.SPACE) {
            throw new IndentIsNotMultipleOf4Error({
                resource: {
                    indent: nextToken.value.length,
                },
                position: nextToken.position,
            })
        }

        if (nextToken && nextToken.type === TOKEN_TYPE.INDENT) {
            const nextDepth = nextToken.value.length

            if (currentDepth < nextDepth && currentDepth + 1 !== nextDepth) {
                if (isCodeEnded(tokens.slice(index + 1))) {
                    continue
                }

                throw new IndentLevelMismatchError({
                    resource: {
                        expected: currentDepth + 1,
                    },
                    position: nextToken.position,
                    tokens: [nextToken],
                })
            }

            currentDepth = nextDepth
        }
    }
}

function trimTokens(_tokens: Token[]) {
    const tokens = [..._tokens]

    while (tokens.length && tokens[0].type === TOKEN_TYPE.NEW_LINE) {
        tokens.shift()
    }

    while (
        tokens.length &&
        [TOKEN_TYPE.NEW_LINE, TOKEN_TYPE.SPACE, TOKEN_TYPE.INDENT].includes(
            tokens[tokens.length - 1].type,
        )
    ) {
        tokens.pop()
    }

    return tokens
}

function isCodeEnded(leftTokens: Token[]) {
    for (let i = 0; i < leftTokens.length; i++) {
        const type = leftTokens[i].type

        if (
            type === TOKEN_TYPE.NEW_LINE ||
            type === TOKEN_TYPE.SPACE ||
            type === TOKEN_TYPE.INDENT
        ) {
            continue
        }

        return false
    }

    return true
}
