import { convertTokensToNodes, type Token, Scope } from '@dalbit-yaksok/core'
import { parseBracket } from './parse-bracket'
import { callSRParseRecursively, ParsingHooks } from './srParse'
import { getMentionReplacers } from './parse-mention'
import { getIdentifierSplittedTokens } from './split-identifer-tokens'

export function parseValue(
    rawTokens: readonly Token[],
    scope: Scope,
    hooks: ParsingHooks = {},
) {
    const srRules = getSRRules(scope)

    const tokens = getIdentifierSplittedTokens(rawTokens, scope)
    const mentionReplacers = getMentionReplacers(tokens, scope)

    const nodes = convertTokensToNodes(scope, tokens, mentionReplacers)

    const bracketParsedNodes = parseBracket(scope, nodes, srRules)

    const childNodes = callSRParseRecursively(
        scope,
        bracketParsedNodes,
        srRules,
        hooks,
    )

    return childNodes
}

function getSRRules(scope: Scope) {
    return scope
        .getRuleListStack()
        .flatMap((s) => s.sr)
        .toArray()
        .toSorted((a, b) => b.pattern.length - a.pattern.length)
}
