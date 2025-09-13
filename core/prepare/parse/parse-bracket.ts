import { UnexpectedEndOfCodeError } from '../../error/prepare.ts'
import { Expression, Node } from '../../node/base.ts'
import { ListLiteral, Sequence } from '../../node/list.ts'
import { Token } from '../tokenize/token.ts'
import type { Rule } from './rule/index.ts'
import { callParseRecursively } from './srParse.ts'

const ALL_OPENING_BRACKETS = ['[', '{', '(']
const OPENING_TO_CLOSING_BRACKETS: Record<string, string> = {
    '[': ']',
    '{': '}',
    '(': ')',
}

export function parseBracket(
    nodes: Node[],
    tokens: Token[],
    dynamicRules: [Rule[][], Rule[][]],
    optimistic = false,
) {
    let openingBracketIndex = nodes.length - 1
    let closingPosition = -1

    rangeSeekingLoop: for (
        openingBracketIndex;
        openingBracketIndex >= 0;
        openingBracketIndex--
    ) {
        const openingBracketNode = nodes[openingBracketIndex]

        const isNotOpeningBracketNode =
            !(openingBracketNode instanceof Expression) ||
            !ALL_OPENING_BRACKETS.includes(openingBracketNode.value)

        if (isNotOpeningBracketNode) {
            continue
        }

        let closingIndexCandidate = openingBracketIndex
        let depth = 0

        while (true) {
            closingIndexCandidate++
            const seekingClosingNode = nodes[closingIndexCandidate]

            const isClosingBracket =
                seekingClosingNode instanceof Expression &&
                seekingClosingNode.value ===
                    OPENING_TO_CLOSING_BRACKETS[openingBracketNode.value]

            if (isClosingBracket) {
                if (closingIndexCandidate - openingBracketIndex <= 2) {
                    continue rangeSeekingLoop
                }

                if (0 < depth) {
                    depth--
                    continue rangeSeekingLoop
                }

                closingPosition = closingIndexCandidate
                break rangeSeekingLoop
            }

            const isOpeningBracket =
                seekingClosingNode instanceof Expression &&
                seekingClosingNode.value ===
                    OPENING_TO_CLOSING_BRACKETS[openingBracketNode.value]

            if (isOpeningBracket) {
                depth++
                continue rangeSeekingLoop
            }

            if (closingIndexCandidate >= nodes.length) {
                if (optimistic) {
                    continue rangeSeekingLoop
                }

                throw new UnexpectedEndOfCodeError({
                    resource: {
                        expected: '닫는 대괄호',
                    },
                    position: nodes[openingBracketIndex].tokens[0].position,
                })
            }
        }
    }

    if (openingBracketIndex < 0) {
        return nodes
    }

    const nodesInBrackets = nodes.slice(
        openingBracketIndex + 1,
        closingPosition,
    )

    const mergedNode = callParseRecursively(nodesInBrackets, dynamicRules)

    if (mergedNode.length === nodesInBrackets.length) {
        return nodes // No change in nodes, return original
    }

    const openingNode = nodes[openingBracketIndex]
    const isOpeningBracketNode = openingNode instanceof Expression && openingNode.value === '['

    if (mergedNode.length === 1 && mergedNode[0] instanceof Sequence && isOpeningBracketNode) {
        const listLiteral = new ListLiteral(
            mergedNode[0].items,
            nodes[openingBracketIndex].tokens,
        )

        const newNodes = [
            ...nodes.slice(0, openingBracketIndex),
            listLiteral,
            ...nodes.slice(closingPosition + 1),
        ]

        return parseBracket(newNodes, tokens, dynamicRules)
    } else {
        const newNodes = [
            ...nodes.slice(0, openingBracketIndex + 1),
            ...mergedNode,
            ...nodes.slice(closingPosition),
        ]

        return parseBracket(newNodes, tokens, dynamicRules)
    }
}
