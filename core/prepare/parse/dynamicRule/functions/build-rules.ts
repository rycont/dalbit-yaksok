import { Rule, Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { FunctionDeclareRange } from './type.ts'

export function buildRules(
    tokens: Token[],
    ranges: FunctionDeclareRange[],
): {
    declareRules: Rule[]
    callingRules: Rule[]
} {
    ranges.map(rangeToRules(tokens))

    return {
        callingRules: [],
        declareRules: [],
    }
}

const rangeToRules = (allTokens: Token[]) => (range: FunctionDeclareRange) => {
    const tokens = allTokens.slice(range.start, range.end + 1)

    const tokenGroups: {
        type: 'static' | 'parameter'
        tokens: Token[]
    }[] = []

    for (const token of tokens) {
        if (token.type === TOKEN_TYPE.SPACE) {
            continue
        }

        if (token.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            tokenGroups.push({
                type: 'parameter',
                tokens: [token],
            })

            continue
        }

        const lastGroup = tokenGroups[tokenGroups.length - 1]

        if (token.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            if (!lastGroup) {
                tokenGroups.push({
                    type: 'parameter',
                    tokens: [token],
                })
            } else {
                lastGroup.tokens.push(token)
            }

            continue
        }

        if (token.type === TOKEN_TYPE.IDENTIFIER) {
            const lastToken =
                lastGroup?.tokens?.[lastGroup?.tokens?.length - 1]?.type

            if (
                !lastToken ||
                lastToken === TOKEN_TYPE.CLOSING_PARENTHESIS ||
                lastToken === TOKEN_TYPE.IDENTIFIER
            ) {
                tokenGroups.push({
                    type: 'static',
                    tokens: [token],
                })
            } else {
                lastGroup.tokens.push(token)
            }

            continue
        }

        if (token.type === TOKEN_TYPE.OPERATOR) {
            if (!lastGroup) {
                tokenGroups.push({
                    type: 'static',
                    tokens: [token],
                })
            } else {
                lastGroup.tokens.push(token)
            }

            continue
        }
    }

    const nameGroups = tokenGroups.map((g) => ({
        type: g.type,
        names: g.tokens
            .filter((t) => t.type === TOKEN_TYPE.IDENTIFIER)
            .map((t) => t.value),
    }))

    const callingRules = createCallingRules(nameGroups)

    return {
        callingRules: ,

    }
}
