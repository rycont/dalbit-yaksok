import {
    TOKEN_TYPE,
    type Token,
    type YaksokSession,
    parse,
    TokenLine,
    Rule,
    DirectReplacer,
    EOL,
    Evaluable,
    IncompleteEvaluable,
    Block,
} from '@dalbit-yaksok/core'

export function parseStatement(
    tokens: Token[],
    session: YaksokSession,
    injectedRules: Rule[],
) {
    let locallyDefinedRules: Rule[] = injectedRules
    const lines = getLineTokens(tokens)

    const grammers = session.extensions
        .flatMap((e) => e.capabilties.Grammer)
        .filter((g) => !!g)

    let i = 0

    const replacers: DirectReplacer[] = []

    while (i < lines.length) {
        const line = lines[i]

        const parsed = grammers
            .values()
            .map((g) => {
                let consumed = 1

                function parseFollowingBlock(scopeRule: Rule[] = []) {
                    const firstLineAfterBlockIndex = lines
                        .slice(i + 1)
                        .findIndex((l) => l.level <= line.level)

                    const blockEndIndex =
                        firstLineAfterBlockIndex === -1
                            ? lines.length - i - 2
                            : firstLineAfterBlockIndex - 1

                    const tokens = lines
                        .slice(i + 1, i + blockEndIndex + 2)
                        .flatMap((l) => l.rawTokens)

                    const node = new Block(
                        parse(
                            tokens,
                            session,
                            locallyDefinedRules.concat(scopeRule),
                        ),
                        tokens,
                    )

                    return {
                        look: node,
                        consume: () => {
                            consumed += blockEndIndex + 1
                            return node
                        },
                    }
                }

                function parseTokens(tokens: Token[]): Evaluable {
                    const parsed = parse(tokens, session, locallyDefinedRules)

                    if (parsed.length === 1 && parsed[0] instanceof Evaluable) {
                        return parsed[0]
                    }

                    return new IncompleteEvaluable(parsed, tokens)
                }

                function nextLines(count: number) {
                    const line = lines.slice(i + 1, i + 1 + count)

                    return {
                        look: line,
                        consume: () => {
                            consumed += line.length
                            return line
                        },
                    }
                }

                const result = g.factory(line, {
                    parseFollowingBlock,
                    nextLines,
                    parse: parseTokens,
                })

                if (result) {
                    return {
                        result,
                        consumed,
                    }
                }

                return null
            })
            .find((n) => n !== null)

        if (!parsed) {
            i++
        } else {
            replacers.push({
                nodes: [parsed.result.instance, new EOL([])],
                tokenRange: [
                    lines[i].validRange[0],
                    lines[i + parsed.consumed - 1].validRange[1],
                ],
            })

            if (parsed.result.rules) {
                locallyDefinedRules = locallyDefinedRules.concat(
                    parsed.result.rules,
                )
            }

            i += parsed.consumed
        }
    }

    return { replacers, rules: locallyDefinedRules }
}

function getLineTokens(tokens: Token[]): TokenLine[] {
    const linebreaks = [-1]
        .concat(
            tokens.flatMap((t, i) =>
                t.type === TOKEN_TYPE.NEW_LINE ? [i] : [],
            ),
        )
        .concat([tokens.length])

    const lines = Array.from({ length: linebreaks.length - 1 }, (_, index) => {
        const lineTokens = tokens.slice(
            linebreaks[index] + 1,
            linebreaks[index + 1] + 1,
        )

        const validTokens = lineTokens.filter(
            (t) =>
                ![
                    TOKEN_TYPE.INDENT,
                    TOKEN_TYPE.LINE_COMMENT,
                    TOKEN_TYPE.SPACE,
                    TOKEN_TYPE.NEW_LINE,
                ].includes(t.type),
        )

        const level =
            lineTokens.length && lineTokens[0].type === TOKEN_TYPE.INDENT
                ? lineTokens[0].value.length / 4
                : 0

        return {
            level,
            validTokens,
            rawTokens: lineTokens,
            validRange: [
                linebreaks[index] + 1 + lineTokens.indexOf(validTokens[0]),
                linebreaks[index] +
                    2 +
                    lineTokens.indexOf(validTokens.slice(-1)[0]),
            ] as [number, number],
        }
    })

    return lines
}
