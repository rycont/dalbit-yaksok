import {
    convertTokensToNodes,
    Node,
    type YaksokSession,
    type Rule,
    type Token,
} from '@dalbit-yaksok/core'

import { callSRParseRecursively } from './srParse.ts'

import { parseIndent } from './parse-indent.ts'
import { parseBracket } from './parse-bracket.ts'
import { parseStatement } from './parse-statement.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

export function parse(
    tokens: Token[],
    session: YaksokSession,
    inheritedRules: Rule[] = [],
): Node[] {
    const mentionRules = getRulesFromMentioningFile(tokens, session)

    const { replacers, rules: statementRules } = parseStatement(
        tokens,
        session,
        inheritedRules.concat(mentionRules),
    )

    const rules = inheritedRules
        .concat(statementRules)
        .concat(mentionRules)
        .concat(session.baseScope?.getExportedRules().toArray() || [])
        .toSorted((a, b) => b.pattern.length - a.pattern.length)
    const nodes = convertTokensToNodes(tokens, replacers)

    const priorityParsedNodes = parseBracket(nodes, rules)
    const indentedNodes = parseIndent(priorityParsedNodes)

    const childNodes = callSRParseRecursively(indentedNodes, rules)
    return childNodes
}
