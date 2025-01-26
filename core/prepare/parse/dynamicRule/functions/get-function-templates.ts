import { RESERVED_WORDS } from '../../../../constant/reserved-words.ts'
import { FunctionMustHaveOneOrMoreStringPartError } from '../../../../error/function.ts'
import { UnexpectedTokenError } from '../../../../error/prepare.ts'
import { CannotUseReservedWordForIdentifierNameError } from '../../../../error/variable.ts'
import {
    FunctionTemplate,
    FunctionTemplatePiece,
} from '../../../../type/function-template.ts'
import { Token, TOKEN_TYPE } from '../../../tokenize/token.ts'

export function convertTokensToFunctionTemplate(
    _tokens: Token[],
): FunctionTemplate {
    const tokens = _tokens.map((token) => ({ ...token }))

    const pieces = tokens
        .map((token, index) => {
            if (token.type !== TOKEN_TYPE.IDENTIFIER) {
                return null
            }

            const isPrevTokenOpeningParenthesis =
                tokens[index - 1]?.type === TOKEN_TYPE.OPENING_PARENTHESIS
            const isNextTokenClosingParenthesis =
                tokens[index + 1]?.type === TOKEN_TYPE.CLOSING_PARENTHESIS

            if (
                isPrevTokenOpeningParenthesis &&
                isNextTokenClosingParenthesis &&
                token.type === TOKEN_TYPE.IDENTIFIER
            ) {
                return {
                    type: 'value',
                    value: [token.value],
                }
            }

            if (token.value.includes('/')) {
                return {
                    type: 'static',
                    value: [...token.value.split('/'), token.value],
                }
            }

            return {
                type: 'static',
                value: [token.value],
            }
        })
        .filter(Boolean) as FunctionTemplatePiece[]

    assertValidFunctionHeader(pieces, tokens)

    const functionName = _tokens
        .map((token) => token.value)
        .join('')
        .trim()

    return {
        name: functionName,
        pieces,
    }
}

function assertValidFunctionHeader(
    pieces: FunctionTemplatePiece[],
    tokens: Token[],
) {
    const hasStaticPiece = pieces.some((piece) => piece.type === 'static')
    if (!hasStaticPiece) {
        throw new FunctionMustHaveOneOrMoreStringPartError({
            tokens,
        })
    }

    for (const [index, token] of tokens.entries()) {
        if (token.type === TOKEN_TYPE.IDENTIFIER) {
            if (RESERVED_WORDS.has(token.value)) {
                throw new CannotUseReservedWordForIdentifierNameError({
                    tokens: [token],
                })
            }
        }

        if (token.type !== TOKEN_TYPE.OPENING_PARENTHESIS) {
            continue
        }

        const nextToken = tokens[index + 1]
        const isNextTokenValid = nextToken?.type === TOKEN_TYPE.IDENTIFIER

        if (!isNextTokenValid) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '약속 인자',
                },
                tokens: [nextToken],
            })
        }

        const nextNextToken = tokens[index + 2]
        const isNextNextTokenValid =
            nextNextToken?.type === TOKEN_TYPE.CLOSING_PARENTHESIS

        if (!isNextNextTokenValid) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '약속 인자를 닫는 괄호',
                },
                tokens: [nextNextToken],
            })
        }
    }
}
