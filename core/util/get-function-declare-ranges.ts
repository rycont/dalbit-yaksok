import {
    isFfiStartingPattern,
    isYaksokStartingPattern,
} from './is-function-starting.ts'
import { TOKEN_TYPE } from '../prepare/tokenize/token.ts'
import { Token } from '../prepare/tokenize/token.ts'
import {
    UnexpectedEndOfCodeError,
    UnexpectedTokenError,
} from '../error/prepare.ts'

interface FunctionDeclareRangesByType {
    yaksok: [number, number][]
    ffi: [number, number][]
}

export function getFunctionDeclareRanges(
    tokens: Token[],
): FunctionDeclareRangesByType {
    const yaksokFunctionDeclareRanges = getFunctionDeclareRangesByType(
        tokens,
        'yaksok',
    )
    const ffiFunctionDeclareRanges = getFunctionDeclareRangesByType(
        tokens,
        'ffi',
    )

    return {
        yaksok: yaksokFunctionDeclareRanges,
        ffi: ffiFunctionDeclareRanges,
    }
}

function getFunctionDeclareRangesByType(
    _tokens: Token[],
    type: 'yaksok' | 'ffi',
) {
    const tokens = [..._tokens]

    const functionStartingIndexes = tokens
        .map(type === 'yaksok' ? isYaksokStartingPattern : isFfiStartingPattern)
        .map((isStarting, index) => (isStarting ? index : -1))
        .filter((index) => index !== -1)

    const functionEndingIndexesByStartingIndex = functionStartingIndexes.map(
        (startingIndex) => getFunctionEndingIndex(tokens, startingIndex),
    )

    const functionDeclareRanges = functionStartingIndexes.map(
        (startingIndex, index) =>
            [startingIndex, functionEndingIndexesByStartingIndex[index]] as [
                number,
                number,
            ],
    )

    if (type === 'yaksok') {
        assertValidYaksokDeclare(tokens, functionDeclareRanges)
    } else {
        assertValidFfiDeclare(tokens, functionDeclareRanges)
    }

    return functionDeclareRanges
}

function getFunctionEndingIndex(tokens: Token[], startingIndex: number) {
    const tokensFromStartingIndex = tokens.slice(startingIndex)
    const nearestNewLineIndexFromStart = tokensFromStartingIndex.findIndex(
        (token) => token.type === TOKEN_TYPE.NEW_LINE,
    )

    if (nearestNewLineIndexFromStart === -1) {
        const lastToken =
            tokensFromStartingIndex[tokensFromStartingIndex.length - 1]

        throw new UnexpectedEndOfCodeError({
            resource: {
                expected: '줄넘김',
            },
            position: lastToken.position,
        })
    }

    return nearestNewLineIndexFromStart + startingIndex + 1
}

function assertValidYaksokDeclare(
    tokens: Token[],
    functionDeclareRanges: [number, number][],
) {
    for (const [_, end] of functionDeclareRanges) {
        const nextToken = tokens[end - 1]
        const nextNextToken = tokens[end]

        if (!nextNextToken) {
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: '들여쓰기',
                },
                position: nextToken.position,
            })
        }

        if (nextNextToken.type !== TOKEN_TYPE.INDENT) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '들여쓰기',
                },
                position: nextNextToken.position,
                tokens: [nextNextToken],
            })
        }
    }
}

function assertValidFfiDeclare(
    tokens: Token[],
    functionDeclareRanges: [number, number][],
) {
    for (const [_, end] of functionDeclareRanges) {
        const nextToken = tokens[end - 1]

        const nextNextToken = tokens[end]

        if (!nextNextToken) {
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: '번역 본문',
                },
                position: nextToken.position,
            })
        }

        if (nextNextToken.type !== TOKEN_TYPE.FFI_BODY) {
            throw new UnexpectedTokenError({
                resource: {
                    parts: '번역 본문',
                },
                position: nextNextToken.position,
                tokens: [nextNextToken],
            })
        }
    }
}
