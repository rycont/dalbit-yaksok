import {
    UnexpectedEndOfCodeError,
    UnexpectedNewlineError,
} from '../../error/prepare.ts'
import { Token, TOKEN_TYPE } from './token.ts'

const OPERATORS = [
    '+',
    '-',
    '*',
    '/',
    '>',
    '<',
    '~',
    '%',
    '**',
    '//',
    '<=',
    '>=',
    '==',
    '!=',
]

export const ASSIGNERS = ['=', '+=', '-=', '*=', '/=', '%=']

const IDENTIFIER_STARTER_REGEX = /[a-zA-Z_가-힣ㄱ-ㅎ]/
const IDENTIFIER_REGEX = /[a-zA-Z_가-힣ㄱ-ㅎ0-9]/
const NUMBER_CHAR_REGEX = /[0-9\.]/

export interface RuleParseResult {
    value: string
    newIndex: number
}

export interface MultiTokenParseResult {
    tokens: { type: TOKEN_TYPE; value: string }[]
    newIndex: number
}

export const RULES: {
    starter: RegExp | string[]
    parse: (
        code: string,
        index: number,
        lastTokens: Token[],
    ) => RuleParseResult | MultiTokenParseResult | null
    type: TOKEN_TYPE
}[] = [
    {
        type: TOKEN_TYPE.NUMBER,
        starter: /[0-9\-]/,
        parse: (code, index, lastTokens) => {
            let i = index
            if (code[i] === '-') {
                if (!isNegativeNumber(lastTokens)) {
                    return null
                }
                i++
            }

            let hasDot = false
            while (i < code.length && code[i].match(NUMBER_CHAR_REGEX)) {
                if (code[i] === '.') {
                    if (hasDot) return null
                    hasDot = true
                }
                i++
            }

            if (i === index || (code[index] === '-' && i === index + 1)) {
                return null // Just a hyphen, not a number
            }

            const value = code.substring(index, i)
            const isNumber = !isNaN(parseFloat(value))

            if (!isNumber) {
                return null
            }

            return { value, newIndex: i }
        },
    },
    {
        type: TOKEN_TYPE.NEW_LINE,
        starter: ['\n'],
        parse: (code, index) => {
            if (code[index] === '\n') {
                return { value: '\n', newIndex: index + 1 }
            }
            return null
        },
    },
    {
        type: TOKEN_TYPE.INDENT,
        starter: ['\t', ' '],
        parse: (code, index) => {
            if (code[index] === '\t') {
                let i = index
                while (i < code.length && code[i] === '\t') {
                    i++
                }
                return { value: code.substring(index, i), newIndex: i }
            }

            if (code[index] === ' ') {
                let i = index
                while (i < code.length && code[i] === ' ') {
                    i++
                }
                const spaces = i - index
                if (spaces > 0 && spaces % 4 === 0) {
                    return { value: '\t'.repeat(spaces / 4), newIndex: i }
                }
            }

            return null
        },
    },
    {
        type: TOKEN_TYPE.SPACE,
        starter: /\s/,
        parse: (code, index) => {
            let i = index
            let spaces = 0
            while (i < code.length && (code[i] === ' ' || code[i] === '\t')) {
                if (code[i] === '\t') {
                    spaces += 4
                } else {
                    spaces++
                }
                i++
            }
            if (i > index) {
                return { value: ' '.repeat(spaces), newIndex: i }
            }
            return null
        },
    },
    {
        type: TOKEN_TYPE.FFI_BODY,
        starter: ['*'],
        parse: (code, index) => {
            const starter = '***\n'
            if (!code.startsWith(starter, index)) {
                return null
            }

            const endIndex = code.indexOf('\n***', index + starter.length)
            if (endIndex === -1) {
                throw new UnexpectedEndOfCodeError({
                    resource: {
                        expected: 'FFI 닫는 구분자 (***)',
                    },
                })
            }

            const newIndex = endIndex + '\n***'.length
            const value = code.substring(index, newIndex)
            return { value, newIndex }
        },
    },
    {
        type: TOKEN_TYPE.ASSIGNER,
        starter: ASSIGNERS.map((a) => a[0]),
        parse: (code, index) => {
            for (const assigner of ASSIGNERS) {
                if (code.startsWith(assigner, index)) {
                    // Check for '==' case
                    if (assigner === '=' && code.startsWith('==', index)) {
                        continue
                    }
                    return {
                        value: assigner,
                        newIndex: index + assigner.length,
                    }
                }
            }
            return null
        },
    },
    {
        type: TOKEN_TYPE.OPERATOR,
        starter: OPERATORS.map((o) => o[0]),
        parse: (code, index) => {
            let bestMatch = ''
            for (const op of OPERATORS) {
                if (code.startsWith(op, index)) {
                    if (op.length > bestMatch.length) {
                        bestMatch = op
                    }
                }
            }

            if (bestMatch) {
                return { value: bestMatch, newIndex: index + bestMatch.length }
            }

            return null
        },
    },
    {
        type: TOKEN_TYPE.IDENTIFIER,
        starter: IDENTIFIER_STARTER_REGEX,
        parse: (code, index) => {
            let i = index
            if (code[i]?.match(IDENTIFIER_STARTER_REGEX)) {
                i++
                while (i < code.length && code[i].match(IDENTIFIER_REGEX)) {
                    i++
                }
                return { value: code.substring(index, i), newIndex: i }
            }
            return null
        },
    },
    {
        type: TOKEN_TYPE.COMMA,
        starter: [','],
        parse: (code, index) =>
            code[index] === ',' ? { value: ',', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.OPENING_PARENTHESIS,
        starter: ['('],
        parse: (code, index) =>
            code[index] === '(' ? { value: '(', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.CLOSING_PARENTHESIS,
        starter: [')'],
        parse: (code, index) =>
            code[index] === ')' ? { value: ')', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.OPENING_BRACKET,
        starter: ['['],
        parse: (code, index) =>
            code[index] === '[' ? { value: '[', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.CLOSING_BRACKET,
        starter: [']'],
        parse: (code, index) =>
            code[index] === ']' ? { value: ']', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.OPENING_BRACE,
        starter: ['{'],
        parse: (code, index) =>
            code[index] === '{' ? { value: '{', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.CLOSING_BRACE,
        starter: ['}'],
        parse: (code, index) =>
            code[index] === '}' ? { value: '}', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.COLON,
        starter: [':'],
        parse: (code, index) =>
            code[index] === ':' ? { value: ':', newIndex: index + 1 } : null,
    },
    {
        type: TOKEN_TYPE.STRING,
        starter: ['"', "'"],
        parse: (code, index) => {
            const quote = code[index]
            let i = index + 1
            let hasInterpolation = false

            // First pass: check if this string has interpolation
            while (i < code.length && code[i] !== quote) {
                if (code[i] === '\n') {
                    throw new UnexpectedNewlineError({
                        parts: '문자열',
                    })
                }
                if (code[i] === '\\' && i + 1 < code.length) {
                    i += 2
                    continue
                }
                if (code[i] === '{') {
                    hasInterpolation = true
                    break
                }
                i++
            }

            // If no interpolation, parse as simple string
            if (!hasInterpolation) {
                i = index + 1
                while (i < code.length && code[i] !== quote) {
                    if (code[i] === '\n') {
                        throw new UnexpectedNewlineError({
                            parts: '문자열',
                        })
                    }
                    if (code[i] === '\\' && i + 1 < code.length) {
                        i += 2
                        continue
                    }
                    i++
                }

                if (i < code.length) {
                    const newIndex = i + 1
                    return { value: code.substring(index, newIndex), newIndex }
                }

                return { value: code.substring(index, i), newIndex: i } // Unterminated string
            }

            // Has interpolation - parse as template string
            const tokens: { type: TOKEN_TYPE; value: string }[] = []
            i = index + 1
            let partStart = i
            let braceDepth = 0

            while (i < code.length) {
                const char = code[i]

                if (char === '\n') {
                    throw new UnexpectedNewlineError({
                        parts: '템플릿 문자열',
                    })
                }

                if (braceDepth === 0 && char === '\\' && i + 1 < code.length) {
                    i += 2
                    continue
                }

                if (braceDepth === 0 && char === quote) {
                    // End of template string
                    const lastPart = code.substring(partStart, i)
                    if (tokens.length === 0) {
                        // No interpolation was actually found (shouldn't happen given our check)
                        return { value: code.substring(index, i + 1), newIndex: i + 1 }
                    }
                    tokens.push({ type: TOKEN_TYPE.TEMPLATE_STRING_END, value: lastPart + quote })
                    return { tokens, newIndex: i + 1 }
                }

                if (braceDepth === 0 && char === '{') {
                    // Start of interpolation
                    const part = code.substring(partStart, i)
                    if (tokens.length === 0) {
                        tokens.push({ type: TOKEN_TYPE.TEMPLATE_STRING_START, value: quote + part })
                    } else {
                        tokens.push({ type: TOKEN_TYPE.TEMPLATE_STRING_PART, value: part })
                    }
                    tokens.push({ type: TOKEN_TYPE.OPENING_BRACE, value: '{' })
                    braceDepth++
                    i++
                    partStart = i
                    continue
                }

                if (braceDepth > 0 && char === '{') {
                    braceDepth++
                    i++
                    continue
                }

                if (braceDepth > 0 && char === '}') {
                    braceDepth--
                    if (braceDepth === 0) {
                        // End of interpolation - tokenize the expression content
                        const exprContent = code.substring(partStart, i).trim()
                        if (exprContent) {
                            const exprTokens = tokenizeExpression(exprContent)
                            for (const token of exprTokens) {
                                tokens.push(token)
                            }
                        }
                        tokens.push({ type: TOKEN_TYPE.CLOSING_BRACE, value: '}' })
                        i++
                        partStart = i
                        continue
                    }
                }

                i++
            }

            // Unterminated template string
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: '템플릿 문자열 닫는 따옴표',
                },
            })
        },
    },
    {
        type: TOKEN_TYPE.LINE_COMMENT,
        starter: ['#'],
        parse: (code, index) => {
            let i = index
            while (i < code.length && code[i] !== '\n' && code[i] !== '\r') {
                i++
            }
            return { value: code.substring(index, i), newIndex: i }
        },
    },
    {
        type: TOKEN_TYPE.MENTION,
        starter: ['@'],
        parse: (code, index) => {
            let i = index + 1
            while (i < code.length && code[i].match(IDENTIFIER_REGEX)) {
                i++
            }
            if (i > index + 1) {
                return { value: code.substring(index, i), newIndex: i }
            }
            return null
        },
    },
]

function isNegativeNumber(tokens: Token[]) {
    if (tokens.length === 0) return true

    const lastToken = tokens[tokens.length - 1]

    const isBlank =
        lastToken.type === TOKEN_TYPE.SPACE ||
        lastToken.type === TOKEN_TYPE.NEW_LINE ||
        lastToken.type === TOKEN_TYPE.INDENT ||
        lastToken.type === TOKEN_TYPE.LINE_COMMENT

    if (isBlank) {
        return true
    }

    const isLastTokenLiteral =
        lastToken.type === TOKEN_TYPE.NUMBER ||
        lastToken.type === TOKEN_TYPE.IDENTIFIER ||
        lastToken.type === TOKEN_TYPE.CLOSING_PARENTHESIS ||
        lastToken.type === TOKEN_TYPE.CLOSING_BRACKET

    if (isLastTokenLiteral) {
        return false
    }

    return true
}

/**
 * Tokenize an expression string (used inside template literal interpolation).
 * This is a simplified tokenizer that handles the subset of tokens valid in expressions.
 */
function tokenizeExpression(expr: string): { type: TOKEN_TYPE; value: string }[] {
    const tokens: { type: TOKEN_TYPE; value: string }[] = []
    let i = 0

    while (i < expr.length) {
        const char = expr[i]

        // Skip whitespace
        if (char === ' ' || char === '\t') {
            i++
            continue
        }

        let matched = false

        // Try each rule (except STRING, NEW_LINE, INDENT, FFI_BODY, LINE_COMMENT, MENTION)
        for (const rule of RULES) {
            // Skip rules not applicable in expressions
            if (
                rule.type === TOKEN_TYPE.STRING ||
                rule.type === TOKEN_TYPE.NEW_LINE ||
                rule.type === TOKEN_TYPE.INDENT ||
                rule.type === TOKEN_TYPE.FFI_BODY ||
                rule.type === TOKEN_TYPE.LINE_COMMENT ||
                rule.type === TOKEN_TYPE.MENTION ||
                rule.type === TOKEN_TYPE.SPACE
            ) {
                continue
            }

            const isStarterMatched = Array.isArray(rule.starter)
                ? rule.starter.includes(char)
                : char.match(rule.starter)

            if (!isStarterMatched) {
                continue
            }

            const result = rule.parse(expr, i, tokens as Token[])

            if (result === null) {
                continue
            }

            // Expression tokenization should only produce single-token results
            if ('tokens' in result) {
                continue
            }

            const { value, newIndex } = result
            tokens.push({ type: rule.type, value })
            i = newIndex
            matched = true
            break
        }

        if (!matched) {
            // Unknown character, skip
            i++
        }
    }

    return tokens
}
