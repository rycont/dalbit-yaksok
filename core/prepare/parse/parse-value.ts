import { convertTokensToNodes, type Token, RuleList } from '@dalbit-yaksok/core'
import { parseBracket } from './parse-bracket'
import { callSRParseRecursively } from './srParse'

export function parseValue(
    tokens: Token[],
    inheritedRules: RuleList = {
        rd: [],
        sr: [],
    },
) {
    const nodes = convertTokensToNodes(tokens)
    const priorityParsedNodes = parseBracket(nodes, inheritedRules)

    const childNodes = callSRParseRecursively(
        priorityParsedNodes,
        inheritedRules.sr,
    )
    return childNodes
}
