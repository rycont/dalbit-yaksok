import { Token, TOKEN_TYPE, tokenize } from '@dalbit-yaksok/core'

export function tokenizeTemplateString(sourceToken: Token) {
    const { value } = sourceToken
    const quoteType =
        value[0] === '"' ? TOKEN_TYPE.DOUBLE_QUOTE : TOKEN_TYPE.SINGLE_QUOTE

    const tokens: Token[] = [
        {
            type: quoteType,
            position: {
                line: 1,
                column: 1,
            },
            value: value[0],
        },
    ]

    let currentOpenIndex: null | number = null
    let depth = 0

    for (let i = 1; i < value.length - 1; i++) {
        const prevToken = tokens[tokens.length - 1]
        const prevEndColumn = prevToken.position.column + prevToken.value.length

        if (value[i] === '{') {
            if (currentOpenIndex === null) {
                currentOpenIndex = i

                tokens.push({
                    type: TOKEN_TYPE.STATIC_STRING,
                    position: {
                        line: 1,
                        column: prevEndColumn,
                    },
                    value: value.slice(prevEndColumn - 1, i),
                })

                tokens.push({
                    type: TOKEN_TYPE.OPENING_BRACKET,
                    position: {
                        line: 1,
                        column: i + 1,
                    },
                    value: value[i],
                })

                continue
            }

            depth++
            continue
        }

        if (value[i] === '}') {
            if (currentOpenIndex === null) {
                continue
            }

            if (depth) {
                depth--
                continue
            }

            const subtokens = tokenize(value.slice(prevEndColumn - 1, i))
            shiftTokensColumn(subtokens, prevEndColumn - 1)

            tokens.push(...subtokens)
            tokens.push({
                type: TOKEN_TYPE.CLOSING_BRACKET,
                position: {
                    line: 1,
                    column: i + 1,
                },
                value: value[i],
            })

            currentOpenIndex = null
        }
    }

    const lastToken = tokens[tokens.length - 1]
    const lastTokenEndColumn =
        lastToken.position.column + lastToken.value.length

    tokens.push({
        type: TOKEN_TYPE.STATIC_STRING,
        position: {
            line: 1,
            column: lastToken.position.column + lastToken.value.length,
        },
        value: value.slice(lastTokenEndColumn - 1, -1),
    })

    tokens.push({
        type: quoteType,
        position: {
            line: 1,
            column: value.length,
        },
        value: value[0],
    })

    shiftTokensColumn(tokens, sourceToken.position.column)
    shiftTokensLine(tokens, sourceToken.position.line)

    return tokens
}

function shiftTokensColumn(tokens: Token[], amount: number) {
    for (const token of tokens) {
        token.position.column += amount - 1
    }
}

function shiftTokensLine(tokens: Token[], amount: number) {
    for (const token of tokens) {
        token.position.line += amount - 1
    }
}
