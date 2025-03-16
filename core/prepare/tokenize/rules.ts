import { NotAcceptableSignal } from './signal.ts'
import { Token, TOKEN_TYPE } from './token.ts'
import { UnexpectedNewlineError } from '../../error/prepare.ts'

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

const IDENTIFIER_STARTER_REGEX = /[a-zA-Z_가-힣ㄱ-ㅎ]/
const IDENTIFIER_REGEX = /[a-zA-Z_가-힣ㄱ-ㅎ0-9]/

export const RULES: {
    starter: RegExp | string[]
    parse: (
        view: () => string | undefined,
        shift: () => string | undefined,
        lastTokens: Token[],
    ) => string
    type: TOKEN_TYPE
}[] = [
    {
        type: TOKEN_TYPE.NUMBER,
        starter: /[0-9\-]/,
        parse: (view, shift, lastTokens) => {
            let value = shift()!

            if (value === '-' && !isNegativeNumber(lastTokens)) {
                throw new NotAcceptableSignal()
            }

            while (
                view() &&
                [
                    '1',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                    '9',
                    '0',
                    '.',
                ].includes(view()!)
            ) {
                value += shift()!
            }

            const isNumber = !isNaN(parseFloat(value))

            if (!isNumber) {
                throw new NotAcceptableSignal()
            }

            return value
        },
    },
    {
        type: TOKEN_TYPE.NEW_LINE,
        starter: ['\n'],
        parse: (_, shift) => {
            shift()
            return '\n'
        },
    },
    {
        type: TOKEN_TYPE.INDENT,
        starter: ['\t'],
        parse: (view, shift) => {
            shift()
            let tabs = 1

            while (view() === '\t') {
                tabs++
                shift()
            }

            return '\t'.repeat(tabs)
        },
    },
    {
        type: TOKEN_TYPE.INDENT,
        starter: [' '],
        parse: (view, shift) => {
            shift()
            let spaces = 1

            while (view() === ' ') {
                spaces++
                shift()
            }

            if (spaces % 4 !== 0) {
                throw new NotAcceptableSignal()
            }

            return '\t'.repeat(spaces / 4)
        },
    },
    {
        type: TOKEN_TYPE.SPACE,
        starter: /\s/,
        parse: (view, shift) => {
            shift()
            let spaces = 1

            while (view() && [' ', '\t'].includes(view()!)) {
                if (view() === '\t') {
                    spaces += 4
                } else {
                    spaces++
                }

                shift()
            }

            return ' '.repeat(spaces)
        },
    },
    {
        type: TOKEN_TYPE.FFI_BODY,
        starter: ['*'],
        parse: (_, shift) => {
            const starter = '***\n'

            for (const char of starter) {
                if (char !== shift()) {
                    throw new NotAcceptableSignal()
                }
            }

            let code = starter

            while (true) {
                code += shift()!

                if (code.endsWith('\n***')) {
                    break
                }
            }

            return code
        },
    },
    {
        type: TOKEN_TYPE.ASSIGNMENT,
        starter: ['='],
        parse: (view, shift) => {
            shift()

            if (view() == '=') {
                throw new NotAcceptableSignal()
            }

            return '='
        },
    },
    {
        type: TOKEN_TYPE.OPERATOR,
        starter: OPERATORS.map((o) => o[0]),
        parse: (view, shift) => {
            let value = shift()!

            while (true) {
                const currentlyAppliable = getAppliableOperators(value)
                if (!currentlyAppliable.length) {
                    break
                }

                const exactlyMatched = currentlyAppliable.includes(value)
                const appliableWithNext = getAppliableOperators(value + view()!)

                if (exactlyMatched && appliableWithNext.length === 0) {
                    break
                }

                if (!appliableWithNext.length) {
                    throw new NotAcceptableSignal()
                }

                value += shift()!
            }

            return value
        },
    },
    {
        type: TOKEN_TYPE.IDENTIFIER,
        starter: IDENTIFIER_STARTER_REGEX,
        parse: (view, shift) => {
            let value = shift()!

            while (view()?.match(IDENTIFIER_REGEX)) {
                value += shift()!
            }

            return value
        },
    },
    {
        type: TOKEN_TYPE.COMMA,
        starter: [','],
        parse: (_, shift) => {
            shift()
            return ','
        },
    },
    {
        type: TOKEN_TYPE.OPENING_PARENTHESIS,
        starter: ['('],
        parse: (_, shift) => {
            shift()
            return '('
        },
    },
    {
        type: TOKEN_TYPE.CLOSING_PARENTHESIS,
        starter: [')'],
        parse: (_, shift) => {
            shift()
            return ')'
        },
    },
    {
        type: TOKEN_TYPE.OPENING_BRACKET,
        starter: ['['],
        parse: (_, shift) => {
            shift()
            return '['
        },
    },
    {
        type: TOKEN_TYPE.CLOSING_BRACKET,
        starter: [']'],
        parse: (_, shift) => {
            shift()
            return ']'
        },
    },
    {
        type: TOKEN_TYPE.STRING,
        starter: ['"', "'"],
        parse: (view, shift) => {
            const quote = shift()!
            let value = quote

            while (view() !== quote) {
                if (view() === undefined) {
                    return value
                }

                if (view() === '\n') {
                    throw new UnexpectedNewlineError({
                        parts: '문자열',
                    })
                }

                value += shift()!
            }

            value += shift()

            return value
        },
    },
    {
        type: TOKEN_TYPE.LINE_COMMENT,
        starter: ['#'],
        parse: (view, shift) => {
            let value = shift()!

            while (
                view() &&
                view() !== '\n' &&
                view() !== '\r' &&
                view() !== undefined
            ) {
                value += shift()!
            }

            return value
        },
    },
    {
        type: TOKEN_TYPE.MENTION,
        starter: ['@'],
        parse: (view, shift) => {
            let value = shift()!

            while (view()?.match(IDENTIFIER_REGEX)) {
                value += shift()!
            }

            return value
        },
    },
]

function getAppliableOperators(prefix: string) {
    return OPERATORS.filter((operator) => operator.startsWith(prefix))
}

function isNegativeNumber(tokens: Token[]) {
    const lastToken = tokens[tokens.length - 1]

    const isBlank =
        !lastToken ||
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
