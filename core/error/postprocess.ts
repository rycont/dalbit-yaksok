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
    (line: YaksokError[], tokens: Token[]): [YaksokError[]]
}

const PROCESSORS: ErrorProcessor[] = [
    parseInvalidDotMethodCall,
    parseNotParsablePrintError,
    parseInvalidVariableName,
    parseVariableAssigningValueParsingError,
    parseGrammarStructureFailure,
    collapseParenthesesErrors,
]

const LAMBDA_PARENTHESES_ERROR_MESSAGE =
    '람다는 괄호로 감싸야 해요. 예시: `리스트.(람다 숫자: 숫자 > 0)로 모두확인하기`'

export function postprocessErrors(
    _errors: YaksokError[],
    tokens: Token[],
    scope: Scope,
): YaksokError[] {
    const lines = splitErrorsByLine(_errors)

    const processedLines = lines.map((line) =>
        PROCESSORS.reduce(
            ([line], processor) => processor(line, tokens),
            [line] as [YaksokError[]],
        )[0],
    )

    let errors: YaksokError[] = []
    for (const line of processedLines) {
        const lambdaParenthesesError = line.find(
            (error) => error.message === LAMBDA_PARENTHESES_ERROR_MESSAGE,
        )
        if (lambdaParenthesesError) {
            errors.push(lambdaParenthesesError)
            break
        }

        if (
            line.length === 1 &&
            (line[0].message.includes('조건문') ||
                line[0].message.includes('반복문'))
        ) {
            errors.push(line[0])
            break
        }
        errors.push(...line)
    }

    errors = suggestFunctionName(errors, scope)

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
    allTokens: Token[],
): [YaksokError[]] {
    const notExecutableEqualSignIndex = line.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '=',
    )

    if (notExecutableEqualSignIndex === -1) {
        return [line]
    }

    const equalSignTokens = line[notExecutableEqualSignIndex].tokens
    if (!equalSignTokens) {
        return [line]
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
    const tokensBeforeEqualSign = allTokens
        .slice(tokenThisLineStartIndex + 1, equalSignTokenIndex)
        .filter(
            (token) =>
                token.type !== TOKEN_TYPE.SPACE &&
                token.type !== TOKEN_TYPE.INDENT,
        )

    if (tokensBeforeEqualSign.length === 1) {
        return [line]
    }

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
        texts: [newToken.value],
    })
    newError.position = startPosition
    newError.tokens = [newToken]

    return [[newError]]
}

function parseVariableAssigningValueParsingError(
    line: YaksokError[],
    tokens: Token[],
): [YaksokError[]] {
    const notExecutableEqualSignIndex = line.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '=',
    )

    if (notExecutableEqualSignIndex === -1) {
        return [line]
    }

    const errorTokens = line[notExecutableEqualSignIndex].tokens

    if (!errorTokens) {
        return [line]
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

        return [[error]]
    }

    return [line.slice(2)]
}

function parseNotParsablePrintError(
    line: YaksokError[],
    tokens: Token[],
): [YaksokError[]] {
    const lastError = line[line.length - 1]

    if (!lastError) {
        return [line]
    }

    const endsWith보여주기 =
        lastError instanceof NotDefinedIdentifierError &&
        lastError.resource?.name === '보여주기'

    if (!endsWith보여주기) {
        return [line]
    }

    return [line.slice(0, -1)]
}

function parseInvalidDotMethodCall(
    line: YaksokError[],
    allTokens: Token[],
): [YaksokError[]] {
    const dotError = line.find(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '.',
    )

    if (!dotError || !dotError.tokens?.[0]) {
        return [line]
    }

    const dotToken = dotError.tokens[0]
    const lineNumber = dotToken.position.line
    const tokensInLine = allTokens.filter(
        (token) => token.position.line === lineNumber,
    )
    const dotIndex = tokensInLine.indexOf(dotToken)

    if (dotIndex === -1) {
        return [line]
    }

    const methodTokens = tokensInLine.slice(dotIndex + 1)
    if (methodTokens.length === 0) {
        return [line]
    }

    if (hasLambdaWithoutImmediateParenthesis(methodTokens)) {
        dotError.tokens = methodTokens
        dotError.message = LAMBDA_PARENTHESES_ERROR_MESSAGE
        return [[dotError]]
    }

    let methodText = methodTokens.map((token) => token.value).join('').trim()
    methodText = methodText.replace(/\s*보여주기\s*$/, '').trim()
    if (methodText.length === 0) {
        return [line]
    }

    dotError.tokens = methodTokens
    dotError.message = `${blue(
        bold(methodText),
    )}라는 메소드를 찾을 수 없어요.`

    return [[dotError]]
}

function hasLambdaWithoutImmediateParenthesis(tokens: Token[]): boolean {
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        if (token.value !== '람다') {
            continue
        }

        let prevNonSpaceToken: Token | undefined
        for (let j = i - 1; j >= 0; j--) {
            if (tokens[j].type !== TOKEN_TYPE.SPACE) {
                prevNonSpaceToken = tokens[j]
                break
            }
        }

        if (prevNonSpaceToken?.type !== TOKEN_TYPE.OPENING_PARENTHESIS) {
            return true
        }
    }

    return false
}

function splitErrorsByLine(errors: YaksokError[]) {
    const lines = new Map<number, YaksokError[]>()

    for (const error of errors) {
        if (!error.tokens || error.tokens.length === 0) continue
        const position = error.tokens[0].position

        const line = position.line
        if (lines.has(line)) {
            lines.get(line)!.push(error)
        } else {
            lines.set(line, [error])
        }
    }

    return Array.from(lines.values())
}

function suggestFunctionName(
    errors: YaksokError[],
    scope: Scope,
): YaksokError[] {
    const functionNames = Array.from(scope.functions.keys())

    if (functionNames.length === 0) {
        return errors
    }

    const functionSignatures = functionNames.map((signature) =>
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

function parseGrammarStructureFailure(
    line: YaksokError[],
    allTokens: Token[],
): [YaksokError[]] {
    const 만약Error = line.find(
        (e) =>
            e instanceof NotDefinedIdentifierError &&
            e.tokens?.some((t) => t.value === '만약'),
    )
    const 이면Error = line.find(
        (e) =>
            e instanceof NotDefinedIdentifierError &&
            e.tokens?.some((t) => t.value === '이면'),
    )

    if (만약Error && 이면Error) {
        const 만약Token = 만약Error.tokens?.find((t) => t.value === '만약')
        const 이면Token = 이면Error.tokens?.find((t) => t.value === '이면')

        if (만약Token && 이면Token) {
            const middleTokens = allTokens.filter(
                (t) =>
                    t.position.line === 만약Token.position.line &&
                    t.position.column > 만약Token.position.column &&
                    t.position.column < 이면Token.position.column,
            )

            const middleText =
                middleTokens.length > 0
                    ? middleTokens
                          .map((t) => t.value)
                          .join('')
                          .trim()
                    : ''

            const error = new YaksokError({ resource: {} })
            error.message = `조건문(${blue(
                bold(`"만약"`),
            )})에서 ${blue(bold(`"${middleText}"`))} 부분을 이해할 수 없어요.`
            error.tokens = middleTokens.length > 0 ? middleTokens : [만약Token]

            return [[error]]
        }
    }

    const 반복Error = line.find(
        (e) =>
            e instanceof NotDefinedIdentifierError &&
            e.tokens?.some((t) => t.value === '반복'),
    )
    const 마다Error = line.find(
        (e) =>
            e instanceof NotDefinedIdentifierError &&
            e.tokens?.some((t) => t.value === '마다'),
    )

    if (반복Error && 마다Error) {
        const 반복Token = 반복Error.tokens?.find((t) => t.value === '반복')
        const 마다Token = 마다Error.tokens?.find((t) => t.value === '마다')

        if (반복Token && 마다Token) {
            const middleTokens = allTokens.filter(
                (t) =>
                    t.position.line === 반복Token.position.line &&
                    t.position.column > 반복Token.position.column &&
                    t.position.column < 마다Token.position.column,
            )

            const middleText =
                middleTokens.length > 0
                    ? middleTokens
                          .map((t) => t.value)
                          .join('')
                          .trim()
                    : ''

            const error = new YaksokError({ resource: {} })
            error.message = `반복문(${blue(
                bold(`"반복"`),
            )})에서 ${blue(bold(`"${middleText}"`))} 부분을 이해할 수 없어요.`
            error.tokens = middleTokens.length > 0 ? middleTokens : [반복Token]

            return [[error]]
        }
    }

    const 동안Error = line.find(
        (e) =>
            e instanceof NotDefinedIdentifierError &&
            e.tokens?.some((t) => t.value === '동안'),
    )

    if (반복Error && 동안Error) {
        const 반복Token = 반복Error.tokens?.find((t) => t.value === '반복')
        const 동안Token = 동안Error.tokens?.find((t) => t.value === '동안')

        if (반복Token && 동안Token) {
            const middleTokens = allTokens.filter(
                (t) =>
                    t.position.line === 반복Token.position.line &&
                    t.position.column > 반복Token.position.column &&
                    t.position.column < 동안Token.position.column,
            )

            const middleText =
                middleTokens.length > 0
                    ? middleTokens
                          .map((t) => t.value)
                          .join('')
                          .trim()
                    : ''

            const error = new YaksokError({ resource: {} })
            error.message = `반복문(${blue(
                bold(`"반복 동안"`),
            )})에서 ${blue(bold(`"${middleText}"`))} 부분을 이해할 수 없어요.`
            error.tokens = middleTokens.length > 0 ? middleTokens : [반복Token]

            return [[error]]
        }
    }

    return [line]
}

function collapseParenthesesErrors(
    line: YaksokError[],
    allTokens: Token[],
): [YaksokError[]] {
    const openingParenErrorIndex = line.findIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === '(',
    )

    const closingParenErrorIndex = line.findLastIndex(
        (error) =>
            error instanceof NotExecutableNodeError &&
            error.tokens?.length === 1 &&
            error.tokens[0].value === ')',
    )

    if (
        openingParenErrorIndex !== -1 &&
        closingParenErrorIndex !== -1 &&
        openingParenErrorIndex < closingParenErrorIndex
    ) {
        const firstToken = line[openingParenErrorIndex].tokens![0]
        const lastToken = line[closingParenErrorIndex].tokens![0]

        // Find all tokens between these two in the same line
        const tokensInLine = allTokens.filter(
            (t) => t.position.line === firstToken.position.line,
        )
        const startIndex = tokensInLine.indexOf(firstToken)
        const endIndex = tokensInLine.indexOf(lastToken)

        const errorTokens = tokensInLine.slice(startIndex, endIndex + 1)

        const newError = new YaksokError({ resource: {} })
        newError.message = '코드를 이해하지 못했어요.'
        newError.tokens = errorTokens
        newError.position = firstToken.position

        return [[newError]]
    }

    return [line]
}
