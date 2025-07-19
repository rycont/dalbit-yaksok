import { RULES } from './rules.ts'
import { NotAcceptableSignal } from './signal.ts'

import { YaksokError } from '../../error/common.ts'
import { TOKEN_TYPE, type Token } from './token.ts'

class Tokenizer {
    private tokens: Token[] = []
    private code: string[]

    private column = 1
    private line = 1
    private bracketDepth = 0 // Added for multi-line array support

    constructor(code: string) {
        this.code = preprocess(code).split('')
    }

    tokenize() {
        while (this.code.length > 0) {
            // Ensure loop terminates correctly if code becomes empty
            const char = this.code[0]

            if (!char) {
                // Should not happen if while condition is this.code.length > 0, but good for safety
                break
            }

            let accepted = false

            for (const rule of RULES) {
                const isStarterMatched = this.isStarterMatched(rule, char)
                if (!isStarterMatched) {
                    continue
                }

                const initialColumnForToken = this.column // Store position for the potential new token
                const initialLineForToken = this.line

                // Create a temporary, consumable copy of the code stream for the current rule parsing attempt.
                // This allows the rule's shift() to modify this copy without affecting the main state until success.
                const currentParseAttempt_Code = this.code.slice()
                let currentParseAttempt_Column = this.column
                let currentParseAttempt_Line = this.line

                try {
                    const view = () => currentParseAttempt_Code[0]
                    const shift = () => {
                        const shiftedChar = currentParseAttempt_Code.shift()
                        if (shiftedChar === '\n') {
                            currentParseAttempt_Line++
                            currentParseAttempt_Column = 1
                        } else if (shiftedChar !== undefined) {
                            currentParseAttempt_Column += shiftedChar.length // Characters from split('') have length 1
                        }
                        return shiftedChar
                    }

                    const value = rule.parse(view, shift, this.tokens)

                    // Rule parsing succeeded.
                    if (
                        rule.type === TOKEN_TYPE.NEW_LINE &&
                        this.bracketDepth > 0
                    ) {
                        // Matched a NEW_LINE rule, and we are inside brackets.
                        // Consume the newline from the main input stream but do not add it to tokens.
                        this.code = currentParseAttempt_Code
                        this.column = currentParseAttempt_Column
                        this.line = currentParseAttempt_Line
                        accepted = true
                        break // Exit RULES loop, continue with the next character from the (now updated) main code stream
                    } else {
                        // This is a token we want to keep.
                        this.tokens.push({
                            type: rule.type,
                            value: value,
                            position: {
                                line: initialLineForToken,
                                column: initialColumnForToken,
                            },
                        })

                        // Update bracketDepth AFTER adding the token, so it reflects state *after* this token.
                        if (rule.type === TOKEN_TYPE.OPENING_BRACKET) {
                            this.bracketDepth++
                        } else if (rule.type === TOKEN_TYPE.CLOSING_BRACKET) {
                            this.bracketDepth--
                            if (this.bracketDepth < 0) {
                                // Safety: Unmatched closing bracket. Parser will likely error.
                                // Resetting to 0 for tokenizer's internal consistency regarding newline skipping.
                                this.bracketDepth = 0
                            }
                        }

                        // Commit consumption of characters by the successful rule to the main state.
                        this.code = currentParseAttempt_Code
                        this.column = currentParseAttempt_Column
                        this.line = currentParseAttempt_Line
                        accepted = true
                        break // Exit RULES loop
                    }
                } catch (e) {
                    if (e instanceof NotAcceptableSignal) {
                        // This rule was not a fit. State (this.code, this.column, this.line) remains as it was
                        // before this rule was attempted. currentParseAttempt_* vars are discarded.
                        continue
                    }

                    // For other errors, if they don't have token info, add current position (before this rule attempt).
                    if (e instanceof YaksokError && !e.tokens && !e.position) {
                        e.position = {
                            column: initialColumnForToken, // Use the column/line at the start of this rule attempt
                            line: initialLineForToken,
                        }
                    }
                    throw e
                }
            }

            if (accepted) {
                continue
            }

            // If no rule accepted the char, it's an UNKNOWN token.
            this.tokens.push({
                type: TOKEN_TYPE.UNKNOWN,
                position: {
                    line: this.line,
                    column: this.column,
                },
                value: char,
            })

            this.code.shift() // Consume the unknown char from the main code stream.
            this.column++ // Advance column for the consumed unknown char.
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
