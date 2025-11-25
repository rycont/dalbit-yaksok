import { Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'
import { blue, bold, YaksokError } from './common.ts'
import { NotExecutableNodeError } from './unknown-node.ts'
import {
    NotDefinedIdentifierError,
    NotProperIdentifierNameToDefineError,
} from './variable.ts'

interface ErrorProcessor {
    (line: YaksokError[], tokens: Token[]): [YaksokError[], Token[]]
}

const PROCESSORS: ErrorProcessor[] = [
    parseInvalidVariableName,
    parseVariableAssigningValueParsingError,
]

export function postprocessErrors(
    _errors: YaksokError[],
    tokens: Token[],
): YaksokError[] {
    const lines = splitErrorsByLine(_errors)

    const processedLines = lines.map(
        (line) =>
            PROCESSORS.reduce(
                ([line, tokens], processor) => processor(line, tokens),
                [line, tokens] as [YaksokError[], Token[]],
            )[0],
    )

    const errors = processedLines.flat()

    for (let i = errors.length - 1; i >= 0; i--) {
        const current = errors[i]
        if (!(current instanceof NotDefinedIdentifierError)) continue

        const previous = errors[i - 1]
        if (!(previous instanceof NotDefinedIdentifierError)) continue

        if (!current.tokens || !previous.tokens) continue

        const currentFirstToken = current.tokens[0]
        const previousLastToken = previous.tokens[previous.tokens.length - 1]

        const currentErrorStartIndex = tokens.indexOf(currentFirstToken)
        const previousErrorEndIndex = tokens.indexOf(previousLastToken)

        const isNear =
            currentErrorStartIndex === previousErrorEndIndex + 1 ||
            (currentErrorStartIndex === previousErrorEndIndex + 2 &&
                tokens[previousErrorEndIndex + 1].type === TOKEN_TYPE.SPACE)

        if (!isNear) continue

        const currentErrorEndIndex = tokens.indexOf(
            current.tokens[current.tokens.length - 1],
        )
        const previousErrorStartIndex = tokens.indexOf(previous.tokens[0])

        const tokensInNewRange = tokens.slice(
            previousErrorStartIndex,
            currentErrorEndIndex + 1,
        )

        previous.resource = {
            name: tokensInNewRange.map((token) => token.value).join(''),
        }
        previous.tokens = tokensInNewRange

        errors.splice(i, 1)
    }

    return errors
}

function parseInvalidVariableName(
    line: YaksokError[],
    tokens: Token[],
): [YaksokError[], Token[]] {
    const notExecutableEqualSignIndex = line.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '=',
    )

    if (notExecutableEqualSignIndex === -1) {
        return [line, tokens]
    }

    const errorTokens = line[notExecutableEqualSignIndex].tokens
    if (!errorTokens) {
        return [line, tokens]
    }

    const lastErrorTokenIndex = tokens.indexOf(
        errorTokens[errorTokens.length - 1],
    )

    const startPosition = tokens[0].position
    const tokensBeforeEqualSign = tokens.slice(0, lastErrorTokenIndex)

    const newToken: Token = {
        type: TOKEN_TYPE.IDENTIFIER,
        value: tokensBeforeEqualSign
            .map((token) => token.value)
            .join('')
            .trim(),
        position: startPosition,
    }

    tokens.splice(0, lastErrorTokenIndex + 1, newToken)

    const newError = new NotProperIdentifierNameToDefineError({
        tokens: [newToken],
    })

    return [[newError], tokens]
}

function parseVariableAssigningValueParsingError(
    line: YaksokError[],
    tokens: Token[],
): [YaksokError[], Token[]] {
    const notExecutableEqualSignIndex = line.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '=',
    )

    if (notExecutableEqualSignIndex === -1) {
        return [line, tokens]
    }

    const conditionalExpressionIndex = line.findIndex(
        (error) =>
            error instanceof NotDefinedIdentifierError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '만약',
    )

    if (conditionalExpressionIndex !== -1) {
        const error = line[
            notExecutableEqualSignIndex
        ] as NotExecutableNodeError

        error.message = `만약에서는 ${blue(
            bold('"=="'),
        )}(등호 두개)를 사용해야 해요.`

        return [[error], tokens]
    }

    return [line, tokens]
}

function splitErrorsByLine(errors: YaksokError[]) {
    const lines: YaksokError[][] = []

    let currentLine = 0

    for (const error of errors) {
        const position = error.tokens?.[0].position

        if (!position) {
            lines.push([error])
            continue
        }

        const line = position.line
        if (line === currentLine) {
            if (!lines[currentLine - 1]) {
                lines[currentLine - 1] = []
            }

            lines[currentLine - 1].push(error)
            continue
        }

        currentLine = line
        lines.push([error])
    }

    return lines
}
