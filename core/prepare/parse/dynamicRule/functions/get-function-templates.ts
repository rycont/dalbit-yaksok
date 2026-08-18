import {
    FUNCTION_HEADER_STATIC_RESERVED_WORDS_ALLOWLIST,
    RESERVED_WORDS,
} from '../../../../constant/reserved-words.ts'
import { FunctionMustHaveOneOrMoreStringPartError } from '../../../../error/function.ts'
import { UnexpectedTokenError } from '../../../../error/prepare.ts'
import { NotProperIdentifierNameToDefineError } from '../../../../error/variable.ts'
import { ParameterElement } from '@dalbit-yaksok/core'
import {
    FunctionTemplate,
    FunctionTemplatePiece,
    PIECE_TYPE,
} from '../../../../type/function-template.ts'
import {
    Token,
    TOKEN_TYPE,
    TOKEN_TYPE_TO_TEXT,
} from '../../../tokenize/token.ts'

export function convertTokensToFunctionTemplate(
    _tokens: Token[],
): FunctionTemplate {
    const tokens = _tokens
        .map((token) => ({ ...token }))
        .filter((t) => t.type !== TOKEN_TYPE.SPACE)
    const rawPieces: FunctionTemplatePiece[] = []

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if (token.type !== TOKEN_TYPE.IDENTIFIER) {
            if (token.value === '/' && rawPieces.length > 0) {
                const last = rawPieces[rawPieces.length - 1]
                if (last.type === PIECE_TYPE.STATIC) {
                    last.variations[0] += '/'
                }
            }
            continue
        }

        const isPrevTokenOpeningParenthesis =
            tokens[i - 1]?.type === TOKEN_TYPE.OPENING_PARENTHESIS

        const isNextTokenClosingParenthesis =
            tokens[i + 1]?.type === TOKEN_TYPE.CLOSING_PARENTHESIS

        if (isPrevTokenOpeningParenthesis && isNextTokenClosingParenthesis) {
            rawPieces.push({ type: PIECE_TYPE.PARAMETER, name: token.value })
            continue
        }

        if (isPrevTokenOpeningParenthesis && !isNextTokenClosingParenthesis) {
            const destructureNames = extractDestructureParameters(tokens, i)

            if (destructureNames.length > 0) {
                rawPieces.push({
                    type: PIECE_TYPE.DESTRUCTURE,
                    parameterElements: destructureNames,
                })
                i += destructureNames.length * 2 - 1
                continue
            }
        }

        if (rawPieces.length > 0) {
            const last = rawPieces[rawPieces.length - 1]
            if (
                last.type === PIECE_TYPE.STATIC &&
                last.variations[0].endsWith('/')
            ) {
                last.variations[0] += token.value
                continue
            }
        }

        rawPieces.push({ type: PIECE_TYPE.STATIC, variations: [token.value] })
    }

    const lastPiece = rawPieces[rawPieces.length - 1]
    const pieces: FunctionTemplatePiece[] = rawPieces.map((piece, index) => {
        if (
            piece.type === PIECE_TYPE.PARAMETER ||
            piece.type === PIECE_TYPE.DESTRUCTURE
        ) {
            return piece
        }

        const isLastPiece = index === rawPieces.length - 1
        const shouldAddVerbFormVariant =
            isLastPiece && lastPiece?.type === PIECE_TYPE.STATIC

        return {
            type: PIECE_TYPE.STATIC,
            variations: createStaticPieceCandidates(
                piece.variations[0],
                shouldAddVerbFormVariant,
            ),
        }
    })

    assertValidFunctionHeader(pieces, tokens)

    const functionName = _tokens
        .map((token) => token.value)
        .join('')
        .trim()

    const parameterScheme = pieces
        .flatMap((p) => {
            if (p.type === PIECE_TYPE.DESTRUCTURE) {
                return p.parameterElements
            }

            if (p.type === PIECE_TYPE.PARAMETER) {
                return [
                    {
                        name: p.name,
                        required: true,
                    },
                ]
            }
        })
        .filter((e) => !!e)

    return {
        name: functionName,
        pieces,
        parameterScheme,
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

function extractDestructureParameters(
    tokens: Token[],
    startIndex: number,
): ParameterElement[] {
    const tokensAfterStart = tokens.slice(startIndex)
    const closingTokenIndex = tokensAfterStart.findIndex(
        (t) => t.type === TOKEN_TYPE.CLOSING_PARENTHESIS,
    )

    const destructuringTokens = tokensAfterStart.slice(0, closingTokenIndex)

    const delimiterIndexes = destructuringTokens
        .map((token, index) => ({
            token,
            index,
        }))
        .filter(({ token }) => token.type === TOKEN_TYPE.COMMA)
        .map(({ index }) => index)

    const groupBoundaries = [
        -1,
        ...delimiterIndexes,
        destructuringTokens.length,
    ]

    const parameterTokenGroups = Array.from(
        { length: groupBoundaries.length - 1 },
        (_, i) =>
            destructuringTokens.slice(
                groupBoundaries[i] + 1,
                groupBoundaries[i + 1],
            ),
    )

    const parameterElements: ParameterElement[] = parameterTokenGroups
        .map((tokenGroup) => {
            const name = tokenGroup.find(
                (t) => t.type === TOKEN_TYPE.IDENTIFIER,
            )?.value
            const hasOptionalMark = tokenGroup.some(
                (t) => t.type === TOKEN_TYPE.QUESTION_MARK,
            )

            if (!name) {
                return null
            }

            return { name, required: !hasOptionalMark } as ParameterElement
        })
        .filter((p) => !!p)

    return parameterElements
}

function assertValidFunctionHeader(
    pieces: FunctionTemplatePiece[],
    tokens: Token[],
) {
    const hasStaticPiece = pieces.some(
        (piece) => piece.type === PIECE_TYPE.STATIC,
    )
    if (!hasStaticPiece) {
        throw new FunctionMustHaveOneOrMoreStringPartError({
            tokens,
        })
    }

    for (const [index, token] of tokens.entries()) {
        if (token.type !== TOKEN_TYPE.IDENTIFIER) {
            continue
        }

        if (!RESERVED_WORDS.has(token.value)) {
            continue
        }

        const isParameterIdentifier = isFunctionParameterIdentifierToken(
            tokens,
            index,
        )

        // 함수 헤더의 정적 문구에서는 일부 예약어를 예외적으로 허용한다.
        if (
            !isParameterIdentifier &&
            FUNCTION_HEADER_STATIC_RESERVED_WORDS_ALLOWLIST.has(token.value)
        ) {
            continue
        }

        throw new NotProperIdentifierNameToDefineError({
            texts: tokens.map((t) => t.value),
        })
    }

    for (const [index, token] of tokens.entries()) {
        if (token.type !== TOKEN_TYPE.OPENING_PARENTHESIS) {
            continue
        }

        const nextToken = tokens[index + 1]
        const isNextTokenIdentifier = nextToken?.type === TOKEN_TYPE.IDENTIFIER

        if (!isNextTokenIdentifier) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '약속 인자',
                },
                tokens: [nextToken],
            })
        }
        const nextNextToken = tokens[index + 2]
        const isSingleParam =
            nextNextToken?.type === TOKEN_TYPE.CLOSING_PARENTHESIS
        const isDestructureParam =
            nextNextToken?.type === TOKEN_TYPE.COMMA ||
            nextNextToken?.type === TOKEN_TYPE.QUESTION_MARK

        if (!isSingleParam && !isDestructureParam) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '약속 인자를 닫는 괄호 또는 추가 인자',
                },
                tokens: [nextNextToken],
            })
        }
    }
}

function isFunctionParameterIdentifierToken(
    tokens: Token[],
    index: number,
): boolean {
    const token = tokens[index]
    if (token?.type !== TOKEN_TYPE.IDENTIFIER) {
        return false
    }

    const prevToken = tokens[index - 1]
    const nextToken = tokens[index + 1]
    const hasParamPrefix =
        prevToken?.type === TOKEN_TYPE.OPENING_PARENTHESIS ||
        prevToken?.type === TOKEN_TYPE.COMMA
    const hasParamSuffix =
        nextToken?.type === TOKEN_TYPE.CLOSING_PARENTHESIS ||
        nextToken?.type === TOKEN_TYPE.COMMA

    return hasParamPrefix && hasParamSuffix
}
