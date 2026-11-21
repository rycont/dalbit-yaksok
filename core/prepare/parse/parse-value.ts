import { convertTokensToNodes, type Token, Scope } from '@dalbit-yaksok/core'
import { parseBracket } from './parse-bracket'
import { callSRParseRecursively } from './srParse'

export function parseValue(tokens: Token[], scope: Scope) {
    const srRules = getSRRules(scope)
    const nodes = convertTokensToNodes(tokens)

    const priorityParsedNodes = parseBracket(nodes, srRules)

    const childNodes = callSRParseRecursively(priorityParsedNodes, srRules)
    return childNodes
}

function getSRRules(scope: Scope) {
    return scope
        .getRuleListStack()
        .flatMap((s) => s.sr)
        .toArray()
        .toSorted((a, b) => b.pattern.length - a.pattern.length)
}
