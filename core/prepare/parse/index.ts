import { YaksokError } from '../../error/common.ts'
import { Block } from '../../node/block.ts'
import { getTokensFromNodes } from '../../util/merge-tokens.ts'
import { convertTokensToNodes } from '../lex/convert-tokens-to-nodes.ts'
import { createDynamicRule } from './dynamicRule/index.ts'
import { parseIndent } from './parse-indent.ts'
import { callParseRecursively } from './srParse.ts'

import { Identifier, Node } from '../../node/base.ts'
import { SetVariable } from '../../node/variable.ts'
import type { CodeFile } from '../../type/code-file.ts'
import { parseBracket } from './parse-bracket.ts'
import type { Rule } from './type.ts'

interface ParseResult {
    ast: Block
    exportedRules: Rule[]
}

export function parse(codeFile: CodeFile, optimistic = false): ParseResult {
    try {
        const dynamicRules = createDynamicRule(codeFile)
        const nodes = convertTokensToNodes(codeFile.tokens)
        const indentedNodes = parseIndent(nodes)

        const indexFetchParsedNodes = codeFile.session?.flags[
            'disable-bracket-first-parsing'
        ]
            ? indentedNodes
            : parseBracket(
                  indentedNodes,
                  codeFile.tokens,
                  dynamicRules,
                  optimistic,
              )

        const childNodes = callParseRecursively(
            indexFetchParsedNodes,
            dynamicRules,
        )
        const childTokens = getTokensFromNodes(childNodes)

        const ast = new Block(childNodes, childTokens)

        const exportedDynamicRules = dynamicRules.flat(2)
        const exportedVariables = extractExportedVariables(childNodes)

        const exportedRules: Rule[] = [
            ...exportedDynamicRules,
            ...exportedVariables,
        ]

        return { ast, exportedRules }
    } catch (error) {
        if (error instanceof YaksokError) {
            if (!error.codeFile) {
                error.codeFile = codeFile
            }
        }

        throw error
    }
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
                        return nodes[0] as Identifier
                    },
                    config: {
                        exported: true,
                    },
                } satisfies Rule),
        )
}
