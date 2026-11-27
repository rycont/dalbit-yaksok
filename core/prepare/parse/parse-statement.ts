import {
    TokenLine,
    Evaluable,
    IncompleteEvaluable,
    Statement,
    parseValue,
    Block,
    FactoryResult,
    RDRule,
    createLineFetcher,
    Scope,
    FactoryParsers,
    Evaluator,
    IndentLevelMismatchError,
} from '@dalbit-yaksok/core'

export function parseStatement(lines: TokenLine[], scope: Scope): Statement[] {
    const parsed =
        scope
            .getRuleListStack()
            .flatMap((ruleList) => ruleList.rd)
            .map((rdRule) => createStatement(rdRule, lines, scope))
            .find((p) => p !== null) ||
        createStatement(Evaluator.SRFallback, lines, scope)!

    const newScope = parsed.scope || scope

    const leftLines = lines.slice(parsed.consumed.currentIndex)

    if (leftLines.length === 0) {
        return [parsed.instance]
    }

    const baseLevel = lines[0].level

    if (lines[0].level !== leftLines[0].level) {
        const baseLevelIndex = leftLines.findIndex((l) => l.level === baseLevel)

        const lastBrokenIndentIndex =
            baseLevelIndex === -1 ? leftLines.length - 1 : baseLevelIndex - 1

        const brokenBlock = new Block(scope, [], lines[0].validTokens)

        brokenBlock.parsingErrors = parsed.instance.parsingErrors.concat(
            new IndentLevelMismatchError({
                resource: {
                    expected: lines[0].level,
                },
                scope: scope,
                tokens: leftLines[0].validTokens,
            }),
        )

        if (lastBrokenIndentIndex === leftLines.length - 1) {
            return [parsed.instance, brokenBlock]
        }

        return [parsed.instance, brokenBlock].concat(
            parseStatement(leftLines.slice(lastBrokenIndentIndex + 1), scope),
        )
    }

    const followingStatement = parseStatement(leftLines, newScope)

    return [parsed.instance].concat(followingStatement)
}

function createStatement(
    rdrule: RDRule,
    lines: TokenLine[],
    scope: Scope,
): FactoryResult | null {
    const parser: FactoryParsers = {
        statement(blockTokenLines, subScope = scope) {
            const statements = parseStatement(blockTokenLines, subScope)
            const blockTokens = blockTokenLines.flatMap((l) => l.validTokens)
            const node = new Block(subScope, statements, blockTokens)

            return node
        },
        value(valueTokens) {
            const parsed = parseValue(valueTokens, scope)

            if (parsed.length === 1 && parsed[0] instanceof Evaluable) {
                return parsed[0]
            }

            // console.log(parsed)

            return new IncompleteEvaluable(parsed, valueTokens)
        },
    }

    const result = rdrule.factory(createLineFetcher<true>(lines), parser, scope)

    return result
}
