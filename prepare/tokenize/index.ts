import {
    IndentIsNotMultipleOf4Error,
    UnexpectedEndOfCodeError,
    UnexpectedCharError,
} from '../../error/index.ts'
import {
    StringValue,
    NumberValue,
    Expression,
    Operator,
    Identifier,
    Indent,
    EOL,
    type Node,
    FFIBody,
    type Position,
} from '../../node/index.ts'
import { lex } from './lex.ts'
import {
    isValidFirstCharForIdentifier,
    isValidCharForIdentifier,
} from './isValidCharForIdentifier.ts'

export class Tokenizer {
    functionHeaders: Node[][] | undefined = undefined
    ffiHeaders: Node[][] | undefined = undefined

    tokens: Node[] = []
    chars: string[]

    line = 0
    column = 0

    static OPERATORS = [
        '+',
        '-',
        '*',
        '/',
        '>',
        '=',
        '<',
        '~',
        '%',
        '**',
        '//',
        '<=',
        '>=',
    ]
    static EXPRESSIONS = ['{', '}', ':', '[', ']', ',', '(', ')', '@']

    constructor(code: string) {
        this.chars = this.preprocess(code)
        this.tokenize()
        this.postprocess()
    }

    tokenize() {
        while (this.chars.length) {
            const char = this.chars[0]

            if (char === '#') {
                this.comment()
                continue
            }

            if (char === ' ') {
                this.indent()
                continue
            }

            if (char === '\n' || char === '\r' || char === '\r\n') {
                this.EOL()
                continue
            }

            if (this.isFFI()) {
                this.ffi()
                continue
            }

            if (this.canBeFisrtCharOfNumber(char)) {
                this.number()
                continue
            }

            if (char === '"') {
                this.string('"')
                continue
            }

            if (char === "'") {
                this.string("'")
                continue
            }

            if (isValidFirstCharForIdentifier(char)) {
                this.identifier()
                continue
            }

            if (Tokenizer.OPERATORS.includes(char)) {
                this.operator()
                continue
            }

            if (Tokenizer.EXPRESSIONS.includes(char)) {
                this.expression()
                continue
            }

            throw new UnexpectedCharError({
                position: this.position,
                resource: {
                    char,
                    parts: '코드',
                },
            })
        }
    }

    isFFI(): boolean {
        const isFFIBlock =
            this.chars[0] === '*' &&
            this.chars[1] === '*' &&
            this.chars[2] === '*'

        return isFFIBlock
    }

    isNumeric(char: string): boolean {
        return '0' <= char && char <= '9'
    }

    canBeFisrtCharOfNumber(char: string): boolean {
        if ('0' <= char && char <= '9') return true

        const isNegativeSign = char === '-'
        const isNextCharNumeric =
            this.chars.length > 0 && this.isNumeric(this.chars[1])

        const lastToken = this.tokens[this.tokens.length - 1]
        const isLastTokenOperator = lastToken instanceof Operator
        const isLastTokenExpression = lastToken instanceof Expression

        const isValidNegativeSign =
            isNegativeSign &&
            isNextCharNumeric &&
            (isLastTokenOperator || isLastTokenExpression)

        return isValidNegativeSign
    }

    ffi() {
        this.shift()
        this.shift()
        this.shift()

        let ffi = ''

        while (true) {
            const nextChar = this.shift()

            if (
                nextChar === '*' &&
                this.chars[0] === '*' &&
                this.chars[1] === '*'
            )
                break

            ffi += nextChar
        }

        this.tokens.push(new FFIBody(ffi, this.position))
        this.shift()
        this.shift()
    }

    comment() {
        while (this.chars.length && this.chars[0] !== '\n') {
            this.shift()
        }
    }

    indent() {
        let spaces = 0
        while (this.chars[0] === ' ') {
            this.shift()
            spaces++
        }

        if (!(this.tokens[this.tokens.length - 1] instanceof EOL)) {
            return
        }

        if (spaces % 4)
            throw new IndentIsNotMultipleOf4Error({
                position: this.position,
                resource: {
                    indent: spaces,
                },
            })
        this.tokens.push(new Indent(spaces / 4, this.position))
    }

    EOL() {
        this.shift()
        if (!(this.tokens[this.tokens.length - 1] instanceof EOL))
            this.tokens.push(new EOL(this.position))
    }

    number() {
        let number = this.shift()!
        let hasDot = false

        while (true) {
            const isNum =
                this.chars.length &&
                '0' <= this.chars[0] &&
                this.chars[0] <= '9'
            const isAllowedDot =
                this.chars.length && this.chars[0] === '.' && !hasDot

            if (!isNum && !isAllowedDot) break
            if (isAllowedDot) hasDot = true

            number += this.shift()
        }

        this.tokens.push(new NumberValue(parseFloat(number), this.position))
    }

    string(openingChar: string) {
        this.shift()
        let word = ''

        while (true) {
            const nextChar = this.shift()
            if (nextChar === openingChar) break

            word += nextChar
        }

        this.tokens.push(new StringValue(word, this.position))
    }

    identifier() {
        let word = ''

        while (this.chars.length && isValidCharForIdentifier(this.chars[0])) {
            word += this.shift()
        }

        this.tokens.push(new Identifier(word, this.position))
    }

    operator() {
        let operator = this.shift()!

        while (true) {
            const nextChar = this.chars[0]

            const nextOperator = operator + nextChar
            const isValidStartingSequence = Tokenizer.OPERATORS.some((op) =>
                op.startsWith(nextOperator),
            )

            if (!isValidStartingSequence) break
            operator = nextOperator
            this.shift()
        }

        this.tokens.push(new Operator(operator, this.position))
    }

    expression() {
        const char = this.shift()!
        this.tokens.push(new Expression(char, this.position))
    }

    preprocess(code: string): string[] {
        const trimmed = '\n' + code + '\n'
        return [...trimmed]
    }

    postprocess(): Node[] {
        const { functionHeaders, ffiHeaders, tokens } = lex(this.tokens)

        this.functionHeaders = functionHeaders
        this.ffiHeaders = ffiHeaders
        this.tokens = tokens

        return tokens
    }

    shift(): string {
        const char = this.chars.shift()

        if (!char) {
            throw new UnexpectedEndOfCodeError({
                position: this.position,
                resource: {
                    parts: '코드',
                },
            })
        }

        if (char === '\n') {
            this.line++
            this.column = 1
        } else {
            this.column++
        }

        return char
    }

    get position(): Position {
        return {
            line: this.line,
            column: this.column,
        }
    }
}

export function tokenize(code: string): TokenizeResult {
    const tokenizer = new Tokenizer(code)

    return {
        tokens: tokenizer.tokens!,
        functionHeaders: tokenizer.functionHeaders!,
        ffiHeaders: tokenizer.ffiHeaders!,
    }
}

export interface TokenizeResult {
    tokens: Node[]
    functionHeaders: Node[][]
    ffiHeaders: Node[][]
}
