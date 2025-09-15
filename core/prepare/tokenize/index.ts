import { RULES, RuleParseResult } from './rules.ts'

import { YaksokError } from '../../error/common.ts'
import { TOKEN_TYPE, type Token } from './token.ts'

class Tokenizer {
    private tokens: Token[] = []
    private code: string
    private index = 0

    private column = 1
    private line = 1
    private bracketDepth = 0 // Added for multi-line array support

    constructor(code: string) {
        this.code = preprocess(code)
    }

    tokenize() {
        while (this.index < this.code.length) {
            const char = this.code[this.index]
            let accepted = false

            for (const rule of RULES) {
                const isStarterMatched = this.isStarterMatched(rule, char)
                if (!isStarterMatched) {
                    continue
                }

                const initialColumnForToken = this.column
                const initialLineForToken = this.line
                const initialIndexForToken = this.index

                try {
                    const result: RuleParseResult | null = rule.parse(
                        this.code,
                        this.index,
                        this.tokens,
                    )

                    if (result === null) {
                        // Rule did not match
                        continue
                    }

                    // Rule parsing succeeded.
                    const { value, newIndex } = result
                    const consumed = this.code.substring(
                        this.index,
                        newIndex,
                    )

                    if (
                        rule.type === TOKEN_TYPE.NEW_LINE &&
                        this.bracketDepth > 0
                    ) {
                        // Matched a NEW_LINE rule, and we are inside brackets.
                        // Consume the newline from the main input stream but do not add it to tokens.
                        this.updatePosition(consumed)
                        this.index = newIndex
                        accepted = true
                        break
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
                        if (
                            rule.type === TOKEN_TYPE.OPENING_BRACKET ||
                            rule.type === TOKEN_TYPE.OPENING_BRACE
                        ) {
                            this.bracketDepth++
                        } else if (
                            rule.type === TOKEN_TYPE.CLOSING_BRACKET ||
                            rule.type === TOKEN_TYPE.CLOSING_BRACE
                        ) {
                            this.bracketDepth--
                            if (this.bracketDepth < 0) {
                                this.bracketDepth = 0
                            }
                        }

                        // Commit consumption of characters by the successful rule to the main state.
                        this.updatePosition(consumed)
                        this.index = newIndex
                        accepted = true
                        break // Exit RULES loop
                    }
                } catch (e) {
                    // For other errors, if they don't have token info, add current position.
                    if (e instanceof YaksokError && !e.tokens && !e.position) {
                        e.position = {
                            column: initialColumnForToken,
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

            this.index++ // Consume the unknown char
            this.column++ // Advance column
        }

        return this.tokens
    }

    private updatePosition(consumed: string) {
        for (const char of consumed) {
            if (char === '\n') {
                this.line++
                this.column = 1
            } else {
                this.column++
            }
        }
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
