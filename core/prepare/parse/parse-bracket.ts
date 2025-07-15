import { Expression, Node } from '../../node/base.ts'
import { Token, TOKEN_TYPE } from '../tokenize/token.ts'
import { Rule } from './rule.ts'
import { callParseRecursively } from './srParse.ts'

export function parseBracket(
    nodes: Node[],
    tokens: Token[],
    dynamicRules: [Rule[][], Rule[][]],
) {
    const lastOpeningBracketIndex = nodes.findLastIndex(
        (node) => node instanceof Expression && node.value === '[',
    )

    if (lastOpeningBracketIndex === -1) {
        return nodes
    }

    checkValidPreToken: if (lastOpeningBracketIndex > 0) {
        const lastOpeningBracketNode = nodes[lastOpeningBracketIndex]
        const lastOpeningBracketToken = lastOpeningBracketNode.tokens[0]
        const lastOpeningBracketTokenIndex = tokens.indexOf(
            lastOpeningBracketToken,
        )
        const lastOpeningBracketPreToken =
            tokens[lastOpeningBracketTokenIndex - 1]

        if (!lastOpeningBracketPreToken) {
            break checkValidPreToken
        }

        if (
            [
                TOKEN_TYPE.NEW_LINE,
                TOKEN_TYPE.SPACE,
                TOKEN_TYPE.INDENT,
                TOKEN_TYPE.OPENING_BRACKET,
                TOKEN_TYPE.OPENING_PARENTHESIS,
            ].includes(lastOpeningBracketPreToken.type)
        ) {
            break checkValidPreToken
        }

        return nodes
    }

    let closingPosition = lastOpeningBracketIndex

    while (true) {
        closingPosition++

        if (closingPosition >= nodes.length) {
            throw new Error(
                'Unmatched opening bracket at position ' +
                    lastOpeningBracketIndex,
            )
        }

        if (
            nodes[closingPosition] instanceof Expression &&
            nodes[closingPosition].value === ']'
        ) {
            break
        }
    }

    const nodesInBrackets = nodes.slice(
        lastOpeningBracketIndex,
        closingPosition + 1,
    )

    const childNodes = callParseRecursively(nodesInBrackets, dynamicRules)
    const newNodes = [
        ...nodes.slice(0, lastOpeningBracketIndex),
        ...childNodes,
        ...nodes.slice(closingPosition + 1),
    ]

    return parseBracket(newNodes, tokens, dynamicRules)
}
