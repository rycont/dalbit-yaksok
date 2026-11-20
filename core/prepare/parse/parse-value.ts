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
    const sortedRulelist = sortSRRules(inheritedRules)
    const nodes = convertTokensToNodes(tokens)

    const priorityParsedNodes = parseBracket(nodes, sortedRulelist)

    const childNodes = callSRParseRecursively(
        priorityParsedNodes,
        sortedRulelist.sr,
    )
    return childNodes
}

function sortSRRules(rulelist: RuleList) {
    return {
        rd: rulelist.rd,
        sr: rulelist.sr.toSorted((a, b) => b.pattern.length - a.pattern.length),
    }
}
