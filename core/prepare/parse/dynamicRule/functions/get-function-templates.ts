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

    const rawPieces = tokens
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
                    type: 'value' as const,
                    value: [token.value],
                }
            }

            return {
                type: 'static' as const,
                value: token.value,
            }
        })
        .filter(Boolean) as Array<
        | { type: 'value'; value: string[] }
        | { type: 'static'; value: string }
    >

    const lastPiece = rawPieces[rawPieces.length - 1]
    const pieces: FunctionTemplatePiece[] = rawPieces.map((piece, index) => {
        if (piece.type === 'value') {
            return piece
        }

        const isLastPiece = index === rawPieces.length - 1
        const shouldAddVerbFormVariant =
            isLastPiece && lastPiece?.type === 'static'

        return {
            type: 'static',
            value: createStaticPieceCandidates(
                piece.value,
                shouldAddVerbFormVariant,
            ),
        }
    })

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

function createStaticPieceCandidates(
    content: string,
    allowVerbFormVariant: boolean,
): string[] {
    const candidates = new Set<string>()

    if (content.includes('/')) {
        const parts = content.split('/')

        for (const part of parts) {
            addVerbFormsToCandidates(part, candidates, allowVerbFormVariant)
        }

        candidates.add(content)

        if (allowVerbFormVariant) {
            const joinedVariant = parts
                .map((part) => convertToVerbForm(part))
                .join('/')

            if (joinedVariant !== content) {
                candidates.add(joinedVariant)
            }
        }

        return [...candidates]
    }

    addVerbFormsToCandidates(content, candidates, allowVerbFormVariant)

    return [...candidates]
}

function addVerbFormsToCandidates(
    word: string,
    candidates: Set<string>,
    allowVerbFormVariant: boolean,
) {
    candidates.add(word)

    if (!allowVerbFormVariant) {
        return
    }

    const verbForm = convertToVerbForm(word)

    if (verbForm !== word) {
        candidates.add(verbForm)
    }
}

function convertToVerbForm(word: string): string {
    if (word.endsWith('기') && word.length > 1) {
        return word.slice(0, -1) + '고'
    }

    return word
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
