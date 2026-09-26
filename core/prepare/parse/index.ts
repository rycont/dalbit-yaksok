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

    const indentedNodes = parseIndent(nodes)
    console.log(indentedNodes)

    const priorityParsedNodes = parseBracket(indentedNodes, rules)
    const childNodes = callParseRecursively(priorityParsedNodes, rules)

    const ast = new Block(childNodes, tokens)

    return ast
}
