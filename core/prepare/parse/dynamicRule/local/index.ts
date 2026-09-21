import {
    DirectReplacer,
    DynamicRules,
    FunctionDeclareHeader,
    Token,
    TOKEN_TYPE,
} from '@dalbit-yaksok/core'

import { FunctionDeclareRange, FunctionPartType, NameGroup } from './type.ts'

import { createCallingRules } from './calling-rules.ts'
import { getDeclareSignature } from './get-function-declare-ranges.ts'

export function buildLocalRules(tokens: Token[]): DynamicRules {
    const ranges = getDeclareSignature(tokens)
    const results = ranges.map(rangeToRules(tokens))

    const replacers = results.map((r) => r.replacer)
    const rules = results.flatMap((r) => r.rules)

    return {
        replacers,
        rules,
    }
}

const rangeToRules = (allTokens: Token[]) => (range: FunctionDeclareRange) => {
    const signatureTokens = allTokens.slice(
        range.signature.start,
        range.signature.end + 1,
    )

    const tokenGroups: {
        type: FunctionPartType
        tokens: Token[]
    }[] = []

    for (const token of signatureTokens) {
        if (token.type === TOKEN_TYPE.SPACE) {
            continue
        }

        if (token.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            tokenGroups.push({
                type: FunctionPartType.parameter,
                tokens: [token],
            })

            continue
        }

        const lastGroup = tokenGroups[tokenGroups.length - 1]

        if (token.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            if (!lastGroup) {
                tokenGroups.push({
                    type: FunctionPartType.parameter,
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
                    type: FunctionPartType.static,
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
                    type: FunctionPartType.static,
                    tokens: [token],
                })
            } else {
                lastGroup.tokens.push(token)
            }

            continue
        }
    }

    const nameGroups = tokenGroups.map<NameGroup>((g, i, a) => {
        const prevGroup = a[i - 1]
        const prevGroupLastToken = prevGroup
            ? prevGroup.tokens[prevGroup.tokens.length - 1]
            : false

        const isSuffix = prevGroupLastToken
            ? prevGroupLastToken.position.column +
                  prevGroupLastToken.value.length ===
              g.tokens[0].position.column
            : false

        return {
            type: g.type,
            names: g.tokens
                .filter((t) => t.type === TOKEN_TYPE.IDENTIFIER)
                .map((t) => t.value),
            isSuffix,
        }
    })

    const functionName = nameGroups
        .map(
            (g) =>
                (g.isSuffix ? '' : ' ') +
                (g.type === FunctionPartType.static
                    ? g.names[0]
                    : g.names.join(', ')),
        )
        .join('')
        .trim()

    const rules = createCallingRules(functionName, nameGroups)

    const lineTokens = allTokens.slice(range.line.start, range.line.end + 1)

    const replacer: DirectReplacer = {
        nodes: [new FunctionDeclareHeader(functionName, lineTokens)],
        tokenRange: [range.line.start, range.line.end],
    }

    return {
        rules,
        replacer,
    }
}
