import {
    convertTokensToNodes,
    Block,
    type YaksokSession,
    type Rule,
    type Token,
} from '@dalbit-yaksok/core'

import { callSRParseRecursively } from './srParse.ts'

import { parseIndent } from './parse-indent.ts'
import { parseBracket } from './parse-bracket.ts'
import { parseStatement } from './parse-statement.ts'

export function parse(
    tokens: Token[],
    session: YaksokSession,
    injectedRules: Rule[] = [],
): Block {
    const { replacers, rules: statementRules } = parseStatement(
        tokens,
        session,
        injectedRules,
    )

    const rules = injectedRules.concat(statementRules)
    const nodes = convertTokensToNodes(tokens, replacers)

    const priorityParsedNodes = parseBracket(nodes, rules)
    const indentedNodes = parseIndent(priorityParsedNodes)

    const childNodes = callSRParseRecursively(indentedNodes, rules)

    const ast = new Block(childNodes, tokens)

    return ast
}
