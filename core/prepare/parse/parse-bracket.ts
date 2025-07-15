import { UnexpectedEndOfCodeError } from '../../error/prepare.ts'
import { Expression, Node } from '../../node/base.ts'
import { Token, TOKEN_TYPE } from '../tokenize/token.ts'
import { Rule } from './rule.ts'
import { callParseRecursively } from './srParse.ts'

export function parseBracket(
    nodes: Node[],
    tokens: Token[],
    dynamicRules: [Rule[][], Rule[][]],
) {
    let listOpeningBracketIndex = nodes.length - 1

    for (
        listOpeningBracketIndex;
        listOpeningBracketIndex >= 0;
        listOpeningBracketIndex--
    ) {
        const node = nodes[listOpeningBracketIndex]

        if (!(node instanceof Expression) || node.value !== '[') {
            continue
        }

        const lastOpeningBracketNode = nodes[listOpeningBracketIndex]
        const lastOpeningBracketToken = lastOpeningBracketNode.tokens[0]
        const lastOpeningBracketTokenIndex = tokens.indexOf(
            lastOpeningBracketToken,
        )
        const lastOpeningBracketPreToken =
            tokens[lastOpeningBracketTokenIndex - 1]

        if (!lastOpeningBracketPreToken) {
            break
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
            break
        }
    }

    if (listOpeningBracketIndex < 0) {
        return nodes
    }

    let closingPosition = listOpeningBracketIndex

    while (true) {
        closingPosition++

        if (closingPosition >= nodes.length) {
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: '닫는 대괄호',
                },
                position: nodes[listOpeningBracketIndex].tokens[0].position,
            })
        }

        if (
            nodes[closingPosition] instanceof Expression &&
            nodes[closingPosition].value === ']'
        ) {
            break
        }
    }

    const nodesInBrackets = nodes.slice(
        listOpeningBracketIndex,
        closingPosition + 1,
    )

    const childNodes = callParseRecursively(nodesInBrackets, dynamicRules)
    const newNodes = [
        ...nodes.slice(0, listOpeningBracketIndex),
        ...childNodes,
        ...nodes.slice(closingPosition + 1),
    ]

    return parseBracket(newNodes, tokens, dynamicRules)
}
