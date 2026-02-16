import {
    FUNCTION_HEADER_STATIC_RESERVED_WORDS_ALLOWLIST,
    RESERVED_WORDS,
} from '../../../../constant/reserved-words.ts'
import { FunctionMustHaveOneOrMoreStringPartError } from '../../../../error/function.ts'
import { UnexpectedTokenError } from '../../../../error/prepare.ts'
import { NotProperIdentifierNameToDefineError } from '../../../../error/variable.ts'
import {
    FunctionTemplate,
    FunctionTemplatePiece,
} from '../../../../type/function-template.ts'
import { Token, TOKEN_TYPE } from '../../../tokenize/token.ts'

export function convertTokensToFunctionTemplate(
    _tokens: Token[],
): FunctionTemplate {
    const tokens = _tokens.map((token) => ({ ...token }))
    const rawPieces: Array<
        | { type: 'value'; value: string[] }
        | { type: 'destructure'; value: string[] }
        | { type: 'static'; value: string }
    > = []

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if (token.type !== TOKEN_TYPE.IDENTIFIER) {
            continue
        }

        const isPrevTokenOpeningParenthesis =
            tokens[i - 1]?.type === TOKEN_TYPE.OPENING_PARENTHESIS
        const isNextTokenClosingParenthesis =
            tokens[i + 1]?.type === TOKEN_TYPE.CLOSING_PARENTHESIS
        const isNextTokenComma = tokens[i + 1]?.type === TOKEN_TYPE.COMMA

        if (isPrevTokenOpeningParenthesis && isNextTokenClosingParenthesis) {
            rawPieces.push({ type: 'value', value: [token.value] })
            continue
        }

        if (isPrevTokenOpeningParenthesis && isNextTokenComma) {
            const destructureNames = extractDestructureNames(tokens, i)
            if (destructureNames.length > 0) {
                rawPieces.push({ type: 'destructure', value: destructureNames })
                i += destructureNames.length * 2 - 1
                continue
            }
        }

        rawPieces.push({ type: 'static', value: token.value })
    }

    const lastPiece = rawPieces[rawPieces.length - 1]
    const pieces: FunctionTemplatePiece[] = rawPieces.map((piece, index) => {
        if (piece.type === 'value' || piece.type === 'destructure') {
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

function extractDestructureNames(
    tokens: Token[],
    startIndex: number,
): string[] {
    const names: string[] = []
    let i = startIndex

    while (i < tokens.length) {
        if (tokens[i].type === TOKEN_TYPE.IDENTIFIER) {
            names.push(tokens[i].value)
            const next = tokens[i + 1]
            if (next?.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
                return names
            }
            if (next?.type === TOKEN_TYPE.COMMA) {
                i += 2
                continue
            }
        }
        return names
    }
    return names
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
        const isDestructureParam = nextNextToken?.type === TOKEN_TYPE.COMMA

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
