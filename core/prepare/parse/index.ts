import { convertTokensToNodes } from '../lex/convert-tokens-to-nodes.ts'
import { getTokensFromNodes } from '../../util/merge-tokens.ts'
import { createDynamicRule } from './dynamicRule/index.ts'
import { YaksokError } from '../../error/common.ts'
import { callParseRecursively } from './srParse.ts'
import { parseIndent } from './parse-indent.ts'
import { Block } from '../../node/block.ts'

import type { CodeFile } from '../../type/code-file.ts'
import type { Rule } from './type.ts'

interface ParseResult {
    ast: Block
    exportedRules: Rule[]
}

export function parse(codeFile: CodeFile): ParseResult {
    try {
        const dynamicRules = createDynamicRule(codeFile)
        const nodes = convertTokensToNodes(codeFile.tokens)
        const indentedNodes = parseIndent(nodes)

        const childNodes = callParseRecursively(indentedNodes, dynamicRules)
        const childTokens = getTokensFromNodes(childNodes)

        const ast = new Block(childNodes, childTokens)

        const exportedRules = dynamicRules.flat(2)

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
