import {
    TOKEN_TYPE,
    type Token,
    type YaksokSession,
    TokenLine,
    Evaluable,
    IncompleteEvaluable,
    RuleList,
    concatRuleList,
    Statement,
    parseValue,
    Block,
} from '@dalbit-yaksok/core'
import { unindent } from './unindent'

export function parseStatement(
    tokens: Token[],
    session: YaksokSession,
    injectedRules: RuleList,
): {
    rules: RuleList
    statements: Statement[]
} {
    let locallyDefinedRules: RuleList = {
        sr: [],
        rd: [],
    }

    const lines = getLineTokens(tokens)

    const extensionGrammers = session.extensions
        .flatMap((e) => e.capabilties.Grammer)
        .filter((g) => !!g)

    let i = 0

    const statements: Statement[] = []

    while (i < lines.length) {
        const line = lines[i]

        const parsed = extensionGrammers
            .concat(locallyDefinedRules.rd)
            .values()
            .map((g) => {
                let consumed = 1

                function getFollowingBlockTokens() {
                    const firstLineAfterBlockIndex = lines
                        .slice(i + consumed)
                        .findIndex(
                            (l) =>
                                l.level <= line.level &&
                                0 < l.validTokens.length,
                        )

                    const blockLinesLength =
                        firstLineAfterBlockIndex === -1
                            ? lines.length - i - 1 - consumed
                            : firstLineAfterBlockIndex - 1

                    const tokens = unindent(
                        lines
                            .slice(
                                i + consumed,
                                i + blockLinesLength + 1 + consumed,
                            )
                            .flatMap((l) => l.rawTokens),
                    )

                    return {
                        look: tokens,
                        consume: () => {
                            consumed += blockLinesLength + 1
                            return tokens
                        },
                    }
                }

                function parseFollowingBlock(scopeRule?: RuleList) {
                    const blockTokens = getFollowingBlockTokens()

                    const parseResult = parseStatement(
                        blockTokens.look,
                        session,
                        concatRuleList([
                            injectedRules,
                            locallyDefinedRules,
                            scopeRule,
                        ]),
                    )

                    if (parseResult.rules) {
                        locallyDefinedRules = concatRuleList([
                            locallyDefinedRules,
                            parseResult.rules,
                        ])
                    }

                    const node = new Block(
                        parseResult.statements,
                        blockTokens.look,
                    )

                    return {
                        look: node,
                        consume: () => {
                            blockTokens.consume()
                            return node
                        },
                    }
                }

                function parseTokens(tokens: Token[]): Evaluable {
                    const parsed = parseValue(
                        tokens,
                        concatRuleList([injectedRules, locallyDefinedRules]),
                    )

                    if (parsed.length === 1 && parsed[0] instanceof Evaluable) {
                        return parsed[0]
                    }

                    return new IncompleteEvaluable(parsed, tokens)
                }

                function nextLines(count: number) {
                    const line = lines.slice(i + consumed, i + consumed + count)

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
                    getFollowingBlockTokens,
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
            statements.push(parsed.result.instance)

            if (parsed.result.rule) {
                locallyDefinedRules = concatRuleList([
                    locallyDefinedRules,
                    parsed.result.rule,
                ])
            }

            i += parsed.consumed
        }
    }

    return { statements, rules: locallyDefinedRules }
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
