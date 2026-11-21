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
} from '@dalbit-yaksok/core'

export function parseStatement(
    lines: TokenLine[],
    scope: Scope,
): {
    statements: Statement[]
    scope: Scope
} {
    if (lines.length === 0) {
        return {
            statements: [],
            scope,
        }
    }

    const parsed = scope
        .getRuleListStack()
        .flatMap((ruleList) => ruleList.rd)
        .map((rdRule) => createStatement(rdRule, lines, scope))
        .find((p) => p !== null)

    if (!parsed) {
        throw '예?'
    }

    const newScope = parsed.scope || scope
    const leftLines = lines.slice(parsed.consumed.currentIndex)

    const followingStatement = parseStatement(leftLines, newScope)

    return {
        statements: [parsed.instance].concat(followingStatement.statements),
        scope: newScope,
    }
}

function createStatement(
    rdrule: RDRule,
    lines: TokenLine[],
    scope: Scope,
): FactoryResult | null {
    const parser: FactoryParsers = {
        statement(blockTokenLines) {
            const { statements } = parseStatement(blockTokenLines, scope)
            const blockTokens = blockTokenLines.flatMap((l) => l.validTokens)
            const node = new Block(statements, blockTokens)

            return node
        },
        value(valueTokens) {
            const parsed = parseValue(valueTokens, scope)

            if (parsed.length === 1 && parsed[0] instanceof Evaluable) {
                return parsed[0]
            }

            return new IncompleteEvaluable(parsed, valueTokens)
        },
    }

    const result = rdrule.factory(createLineFetcher<true>(lines), parser, scope)

    return result
}
