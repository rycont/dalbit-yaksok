import { TOKEN_TYPE } from '@dalbit-yaksok/core'
import { Expression, Node } from '../../node/base.ts'
import { EOL } from '../../node/index.ts'
import { Rule } from './rule.ts'
import { callParseRecursively } from './srParse.ts'

export function parseBracket(
    nodes: Node[],
    dynamicRules: [Rule[][], Rule[][]],
) {
    const lastOpeningBracketIndex = nodes.findLastIndex(
        (node) => node instanceof Expression && node.value === '[',
    )

    if (lastOpeningBracketIndex === -1) {
        return nodes
    }

    checkValidPreToken: if (lastOpeningBracketIndex > 0) {
        const lastOpeningBracketPrevToken = nodes[lastOpeningBracketIndex - 1]
        // Is opening parenthesis or whitespace or newline or opening bracket

        const isOpeningParenthesis =
            lastOpeningBracketPrevToken instanceof Expression &&
            lastOpeningBracketPrevToken.value === '('

        if (isOpeningParenthesis) {
            break checkValidPreToken
        }

        const isNewLine = lastOpeningBracketPrevToken instanceof EOL

        if (isNewLine) {
            break checkValidPreToken
        }

        const isWhitespace =
            lastOpeningBracketPrevToken.tokens.slice(-1)[0].type ===
            TOKEN_TYPE.SPACE

        if (isWhitespace) {
            break checkValidPreToken
        }

        const isOpeningBracket =
            lastOpeningBracketPrevToken instanceof Expression &&
            lastOpeningBracketPrevToken.value === '['

        if (isOpeningBracket) {
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

    return parseBracket(newNodes, dynamicRules)
}
