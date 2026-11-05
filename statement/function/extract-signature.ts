import { Token, TOKEN_TYPE } from '@dalbit-yaksok/core'
import {
    FunctionPartType,
    FunctionHeaderPart,
    ParameterElement,
    FunctionSignature,
} from './type'

export function extractSignature(signatureTokens: Token[]): FunctionSignature {
    const tokenGroups: {
        type: FunctionPartType
        tokens: Token[]
    }[] = []

    const notParsableTokens: Token[] = []

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

        if (token.type === TOKEN_TYPE.QUESTION_MARK) {
            lastGroup.tokens.push(token)
            continue
        }

        if (token.type === TOKEN_TYPE.COMMA) {
            lastGroup.tokens.push(token)
            continue
        }

        notParsableTokens.push(token)
    }

    const headerParts = tokenGroups.map<FunctionHeaderPart>((g, i, a) => {
        const prevGroup = a[i - 1]
        const prevGroupLastToken = prevGroup
            ? prevGroup.tokens[prevGroup.tokens.length - 1]
            : false

        if (g.type === FunctionPartType.static) {
            const isSuffix =
                g.type === FunctionPartType.static &&
                prevGroupLastToken &&
                (prevGroupLastToken.type === TOKEN_TYPE.IDENTIFIER ||
                    prevGroupLastToken.type === TOKEN_TYPE.CLOSING_PARENTHESIS)
                    ? prevGroupLastToken.position.column +
                          prevGroupLastToken.value.length ===
                      g.tokens[0].position.column
                    : false

            return {
                type: FunctionPartType.static,
                isSuffix,
                names: g.tokens,
            }
        }

        return {
            type: FunctionPartType.parameter,
            params: g.tokens
                .map<ParameterElement | null>((token, index, all) => {
                    if (token.type !== TOKEN_TYPE.IDENTIFIER) {
                        return null
                    }

                    const nextToken = all[index + 1]
                    const optional =
                        nextToken?.type === TOKEN_TYPE.QUESTION_MARK

                    const tokens = optional ? [token, nextToken] : [token]

                    return {
                        name: token.value,
                        optional: optional ?? false,
                        tokens,
                    }
                })
                .filter((t): t is ParameterElement => t !== null),
        }
    })

    const functionName = headerParts
        .map((g) =>
            g.type === FunctionPartType.static
                ? (g.isSuffix ? '' : ' ') + g.names[0].value
                : `(${g.params.map((p) => p.name).join(', ')})`,
        )
        .join('')
        .trim()

    const parameterScheme = headerParts.flatMap((g) =>
        g.type === FunctionPartType.parameter ? g.params : [],
    )

    return {
        functionName,
        parameterScheme,
        headerParts,
    }

    //     const invokingRules = createCallingRules(
    //         functionName,
    //         headerParts,
    //         parameterScheme,
    //         range,
    //     )
    //
    //     const lineTokens = allTokens.slice(range.line.start, range.line.end + 1)
    //

    //
    //     if (0 < notParsableTokens.length) {
    //         declareNode.injectError(
    //             new UnexpectedTokenError({
    //                 resource: {
    //                     parts: '약속 이름',
    //                 },
    //                 tokens: notParsableTokens,
    //             }),
    //         )
    //     }
    //
    //     const replacer: DirectReplacer = {
    //         nodes: [declareNode],
    //         tokenRange: [range.line.start, range.line.end],
    //     }
    //
    //     return {
    //         rules: invokingRules,
    //         replacer,
    //     }
}
