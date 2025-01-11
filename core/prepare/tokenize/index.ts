import { NotAcceptableSignal } from './signal.ts'
import { RULES } from './rules.ts'

import { TOKEN_TYPE, type Token } from './token.ts'

class Tokenizer {
    private tokens: Token[] = []
    private code: string[]

    private column = 1
    private line = 1

    constructor(code: string) {
        this.code = preprocess(code).split('')
    }

    tokenize() {
        while (this.code) {
            const char = this.code[0]

            if (!char) {
                break
            }

            let accepted = false

            for (const rule of RULES) {
                const isStarterMatched = this.isStarterMatched(rule, char)
                if (!isStarterMatched) {
                    continue
                }

                const codeCheckpoint = this.code.slice()

                let columnCheckpoint = this.column
                let lineCheckpoint = this.line

                try {
                    const view = () => codeCheckpoint[0]
                    const shift = () => {
                        const shifted = codeCheckpoint.shift()

                        if (shifted === '\n') {
                            lineCheckpoint++
                            columnCheckpoint = 1
                        } else {
                            columnCheckpoint++
                        }

                        return shifted
                    }

                    const value = rule.parse(view, shift, this.tokens)

                    this.tokens.push({
                        type: rule.type,
                        value,
                        position: {
                            column: this.column,
                            line: this.line,
                        },
                    })

                    this.code = codeCheckpoint
                    this.column = columnCheckpoint
                    this.line = lineCheckpoint

                    accepted = true

                    break
                } catch (e) {
                    if (e instanceof NotAcceptableSignal) {
                        continue
                    }
                }
            }

            if (accepted) {
                continue
            }

            this.tokens.push({
                type: TOKEN_TYPE.UNKNOWN,
                position: {
                    column: this.column,
                    line: this.line,
                },
                value: char,
            })

            this.code.shift()
            this.column++
        }

        return this.tokens
    }

    private isStarterMatched(rule: (typeof RULES)[number], char: string) {
        if (Array.isArray(rule.starter)) {
            return rule.starter.includes(char)
        }

        return char.match(rule.starter)
    }
}

export function tokenize(text: string): Token[] {
    const tokens = new Tokenizer(text).tokenize()
    return tokens
}

function preprocess(code: string) {
    return code.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}
