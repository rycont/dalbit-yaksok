import { UnexpectedEndOfCodeError } from '../../error/prepare.ts'
import { Expression, Node } from '../../node/base.ts'
import { ListLiteral } from '../../node/list.ts'
import { Token, TOKEN_TYPE } from '../tokenize/token.ts'
import { Rule } from './rule.ts'
import { callParseRecursively } from './srParse.ts'

export function parseIndexFetch(
    nodes: Node[],
    tokens: Token[],
    dynamicRules: [Rule[][], Rule[][]],
) {
    let indexingOpeningBracketIndex = nodes.length - 1

    for (
        indexingOpeningBracketIndex;
        indexingOpeningBracketIndex >= 0;
        indexingOpeningBracketIndex--
    ) {
        const node = nodes[indexingOpeningBracketIndex]

        if (!(node instanceof Expression) || node.value !== '[') {
            continue
        }

        const lastOpeningBracketNode = nodes[indexingOpeningBracketIndex]
        if (
            lastOpeningBracketNode instanceof Expression &&
            lastOpeningBracketNode.value === ')'
        ) {
            break
        }

        if (lastOpeningBracketNode instanceof ListLiteral) {
            break
        }

        const lastOpeningBracketToken = lastOpeningBracketNode.tokens[0]
        const lastOpeningBracketTokenIndex = tokens.indexOf(
            lastOpeningBracketToken,
        )
        const lastOpeningBracketPreToken =
            tokens[lastOpeningBracketTokenIndex - 1]

        if (!lastOpeningBracketPreToken) {
            break
        }

        if (TOKEN_TYPE.IDENTIFIER === lastOpeningBracketPreToken.type) {
            break
        }
    }

    if (indexingOpeningBracketIndex < 0) {
        return nodes
    }

    let closingPosition = indexingOpeningBracketIndex

    while (true) {
        closingPosition++

        if (closingPosition >= nodes.length) {
            throw new UnexpectedEndOfCodeError({
                resource: {
                    expected: '닫는 대괄호',
                },
                position: nodes[indexingOpeningBracketIndex].tokens[0].position,
            })
        }

        if (
            nodes[closingPosition] instanceof Expression &&
            nodes[closingPosition].value === ']'
        ) {
            break
        }
    }

    if (closingPosition - indexingOpeningBracketIndex <= 2) {
        return nodes
    }

    const nodesInBrackets = nodes.slice(
        indexingOpeningBracketIndex + 1,
        closingPosition,
    )

    const childNodes = callParseRecursively(nodesInBrackets, dynamicRules)

    // console.log(childNodes)

    const newNodes = [
        ...nodes.slice(0, indexingOpeningBracketIndex + 1),
        ...childNodes,
        ...nodes.slice(closingPosition),
    ]

    return parseIndexFetch(newNodes, tokens, dynamicRules)
}
