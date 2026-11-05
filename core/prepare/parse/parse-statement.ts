import {
    TOKEN_TYPE,
    type Token,
    type YaksokSession,
    parse,
    TokenLine,
    Rule,
    DirectReplacer,
} from '@dalbit-yaksok/core'
// import { createDynamicRules } from './dynamicRule/index.ts'

export function parseStatement(
    tokens: Token[],
    session: YaksokSession,
    injectedRules: Rule[],
) {
    // const { replacers, rules } = createDynamicRules(tokens, session)

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
                let consumed = 0

                function parseFollowingBlock(scopeRule: Rule[] = []) {
                    const blockEndIndex = lines
                        .slice(i + 1)
                        .findIndex((l) => l.level <= line.level)

                    const tokens = lines
                        .slice(i + 1, i + blockEndIndex + 1)
                        .flatMap((l) => l.rawTokens)

                    const node = parse(
                        tokens,
                        session,
                        locallyDefinedRules.concat(scopeRule),
                    )

                    return {
                        look: node,
                        consume: () => {
                            consumed += blockEndIndex + 1
                            return node
                        },
                    }
                }

                function nextLine(offset: number) {
                    const line = lines[i + offset]
                    return {
                        look: line,
                        consume: () => {
                            consumed++
                            return line
                        },
                    }
                }

                const result = g.factory(line, {
                    parseFollowingBlock,
                    nextLine,
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
                nodes: [parsed.result.instance],
                tokenRange: [
                    lines[i].range[0],
                    lines[i + parsed.consumed].range[1],
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

        const validTokens = lineTokens
            .slice(0, -1)
            .filter(
                (t) =>
                    ![
                        TOKEN_TYPE.INDENT,
                        TOKEN_TYPE.LINE_COMMENT,
                        TOKEN_TYPE.SPACE,
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
            range: [linebreaks[index] + 1, linebreaks[index + 1] + 1] as [
                number,
                number,
            ],
        }
    })

    return lines
}
