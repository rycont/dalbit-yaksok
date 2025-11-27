import { Scope } from '../executer/scope.ts'
import { Token, TOKEN_TYPE } from '../prepare/tokenize/token.ts'
import { levenshtein } from '../util/levelshtein.ts'
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
    parseNotParsablePrintError,
    parseInvalidVariableName,
    parseVariableAssigningValueParsingError,
]

export function postprocessErrors(
    _errors: YaksokError[],
    tokens: Token[],
    scope: Scope,
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

    const functionNameSuggestedErrors = suggestFunctionName(errors, scope)
    return functionNameSuggestedErrors
}

function parseInvalidVariableName(
    line: YaksokError[],
    allTokens: Token[],
): [YaksokError[], Token[]] {
    const notExecutableEqualSignIndex = line.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '=',
    )

    if (notExecutableEqualSignIndex === -1) {
        return [line, allTokens]
    }

    const equalSignTokens = line[notExecutableEqualSignIndex].tokens
    if (!equalSignTokens) {
        return [line, allTokens]
    }

    const errorLine = equalSignTokens[0].position.line

    const tokenThisLineStartIndex = allTokens.findLastIndex(
        (token) => token.position.line < errorLine,
    )
    const tokenThisLineEndIndex = allTokens.findIndex(
        (token) => token.position.line > errorLine,
    )

    const thisLineTokens = allTokens.slice(
        tokenThisLineStartIndex + 1,
        tokenThisLineEndIndex,
    )

    const equalSignTokenIndex = allTokens.indexOf(
        equalSignTokens[equalSignTokens.length - 1],
    )

    const startPosition = thisLineTokens[0].position
    const tokensBeforeEqualSign = thisLineTokens.slice(
        0,
        equalSignTokenIndex - 1,
    )

    const newToken: Token = {
        type: TOKEN_TYPE.IDENTIFIER,
        value: tokensBeforeEqualSign
            .map((token) => token.value)
            .join('')
            .trim(),
        position: startPosition,
    }

    allTokens.splice(tokenThisLineStartIndex, tokenThisLineEndIndex, newToken)

    const newError = new NotProperIdentifierNameToDefineError({
        tokens: [newToken],
    })

    return [[newError], allTokens]
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

    const errorTokens = line[notExecutableEqualSignIndex].tokens

    if (!errorTokens) {
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

function parseNotParsablePrintError(
    line: YaksokError[],
    tokens: Token[],
): [YaksokError[], Token[]] {
    const lastError = line[line.length - 1]

    if (!lastError) {
        return [line, tokens]
    }

    const endsWith보여주기 =
        lastError instanceof NotDefinedIdentifierError &&
        lastError.resource?.name === '보여주기'

    if (!endsWith보여주기) {
        return [line, tokens]
    }

    return [line.slice(0, -1), tokens]
}

function splitErrorsByLine(errors: YaksokError[]) {
    const lines = new Map<number, YaksokError[]>()
    let lastLine = 0

    for (const error of errors) {
        const position = error.tokens?.[error.tokens.length - 1].position

        lastLine = position?.line || lastLine
        lines.set(lastLine, [...(lines.get(lastLine) || []), error])
    }

    return [...lines.entries()]
        .toSorted((a, b) => a[0] - b[0])
        .map((entry) => entry[1])
}

function suggestFunctionName(
    errors: YaksokError[],
    scope: Scope,
): YaksokError[] {
    const functionSignatures = Array.from(scope.functions.keys()).map(
        (signature) =>
            signature
                .split(/\(.*?\)/g)
                .map((part) => part.trim())
                .filter((part) => part !== ''),
    )

    for (let i = 0; i < errors.length; i++) {
        if (!isLongError(errors[i])) {
            continue
        }

        let tokens = errors[i].tokens
        if (!tokens) {
            continue
        }

        tokens = tokens.filter((token) => token.value !== '보여주기')

        const tokenString = tokens.map((token) => token.value).join('')
        const closestFunctionSignature = functionSignatures
            .map((staticParts) =>
                staticParts.map(
                    (signature) =>
                        [
                            signature,
                            levenshtein(tokenString, signature),
                        ] as const,
                ),
            )
            .flat()
            .sort((a, b) => a[1] - b[1])[0]

        if (closestFunctionSignature[1] < 4) {
            errors[i].resource = {
                suggestedFix: closestFunctionSignature[0],
            }
        }
    }

    return errors
}

function isLongError(error: YaksokError): boolean {
    const firstToken = error.tokens?.[0]
    const lastToken = error.tokens?.[error.tokens.length - 1]

    if (!firstToken || !lastToken) {
        return false
    }
    if (firstToken.position.line !== lastToken.position.line) {
        return true
    }

    const length =
        lastToken.position.column -
        firstToken.position.column +
        lastToken.value.length

    return length > 5
}
