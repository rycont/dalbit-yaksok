import { Block } from '../../node/block.ts'
import { convertTokensToNodes } from '../lex/convert-tokens-to-nodes.ts'
import { createDynamicRule } from './dynamicRule/index.ts'
import { parseIndent } from './parse-indent.ts'
import { callParseRecursively } from './srParse.ts'

import { Identifier, Node } from '../../node/base.ts'
import { SetVariable } from '../../node/variable.ts'
import { parseBracket } from './parse-bracket.ts'

import type { Rule } from './type.ts'
import { Token, YaksokSession } from '@dalbit-yaksok/core'

export function parse(tokens: Token[], session: YaksokSession) {
    const { rules: dynamicRules } = createDynamicRule(tokens, session)
    const nodes = convertTokensToNodes(tokens)
    const indentedNodes = parseIndent(nodes)

    const priorityParsedNodes = parseBracket(indentedNodes, dynamicRules)

    const childNodes = callParseRecursively(priorityParsedNodes, dynamicRules)

    const ast = new Block(childNodes, tokens)

    return ast
}

function extractExportedVariables(nodes: Node[]): Rule[] {
    return nodes
        .filter((node) => node instanceof SetVariable)
        .map(
            (node) =>
                ({
                    pattern: [
                        {
                            type: Identifier,
                            value: node.name,
                        },
                    ],
                    factory(nodes) {
                        return nodes[0]
                    },
                    config: {
                        exportedScope: true,
                    },
                }) as Rule,
        )
}
