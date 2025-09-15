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

export const RULES: {
    starter: RegExp | string[]
    parse: (
        code: string,
        index: number,
        lastTokens: Token[],
    ) => RuleParseResult | null
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
            let spaces = 0;
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
                    return { value: assigner, newIndex: index + assigner.length }
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
            code[index] === ','
                ? { value: ',', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.OPENING_PARENTHESIS,
        starter: ['('],
        parse: (code, index) =>
            code[index] === '('
                ? { value: '(', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.CLOSING_PARENTHESIS,
        starter: [')'],
        parse: (code, index) =>
            code[index] === ')'
                ? { value: ')', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.OPENING_BRACKET,
        starter: ['['],
        parse: (code, index) =>
            code[index] === '['
                ? { value: '[', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.CLOSING_BRACKET,
        starter: [']'],
        parse: (code, index) =>
            code[index] === ']'
                ? { value: ']', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.OPENING_BRACE,
        starter: ['{'],
        parse: (code, index) =>
            code[index] === '{'
                ? { value: '{', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.CLOSING_BRACE,
        starter: ['}'],
        parse: (code, index) =>
            code[index] === '}'
                ? { value: '}', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.COLON,
        starter: [':'],
        parse: (code, index) =>
            code[index] === ':'
                ? { value: ':', newIndex: index + 1 }
                : null,
    },
    {
        type: TOKEN_TYPE.STRING,
        starter: ['"', "'"],
        parse: (code, index) => {
            const quote = code[index]
            let i = index + 1
            while (i < code.length && code[i] !== quote) {
                if (code[i] === '\n') {
                    throw new UnexpectedNewlineError({
                        parts: '문자열',
                    })
                }
                i++
            }

            if (i < code.length) {
                const newIndex = i + 1
                return { value: code.substring(index, newIndex), newIndex }
            }

            return { value: code.substring(index, i), newIndex: i } // Unterminated string
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
