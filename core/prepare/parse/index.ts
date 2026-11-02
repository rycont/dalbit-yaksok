import {
    convertTokensToNodes,
    Block,
    YaksokSession,
    type Token,
} from '@dalbit-yaksok/core'

import { createDynamicRules } from './dynamicRule/index.ts'
import { parseIndent } from './parse-indent.ts'
import { callParseRecursively } from './srParse.ts'

import { parseBracket } from './parse-bracket.ts'

export function parse(tokens: Token[], session: YaksokSession): Block {
    const { replacers, rules } = createDynamicRules(tokens, session)

    const nodes = convertTokensToNodes(tokens, replacers)

    const priorityParsedNodes = parseBracket(nodes, rules)
    const indentedNodes = parseIndent(priorityParsedNodes)

    const childNodes = callParseRecursively(indentedNodes, rules)

    const ast = new Block(childNodes, tokens)

    return ast
}
