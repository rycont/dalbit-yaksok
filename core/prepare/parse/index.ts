import { Block } from '../../node/block.ts'
import { convertTokensToNodes } from '../lex/convert-tokens-to-nodes.ts'
import { createDynamicRules } from './dynamicRule/index.ts'
import { parseIndent } from './parse-indent.ts'
import { callParseRecursively } from './srParse.ts'

import { parseBracket } from './parse-bracket.ts'
import { Token, YaksokSession } from '@dalbit-yaksok/core'

export * from './type.ts'

export function parse(tokens: Token[], session: YaksokSession): Block {
    const { replacers, rules } = createDynamicRules(tokens, session)

    const nodes = convertTokensToNodes(tokens, replacers)

    const priorityParsedNodes = parseBracket(nodes, rules)
    const indentedNodes = parseIndent(priorityParsedNodes)

    const childNodes = callParseRecursively(indentedNodes, rules)

    const ast = new Block(childNodes, tokens)

    return ast
}
