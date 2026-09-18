import { YaksokError } from '../../error/common.ts'
import { Block } from '../../node/block.ts'
import { convertTokensToNodes } from '../lex/convert-tokens-to-nodes.ts'
import { createDynamicRule } from './dynamicRule/index.ts'
import { parseIndent } from './parse-indent.ts'
import { callParseRecursively } from './srParse.ts'

import { Identifier, Node } from '../../node/base.ts'
import { SetVariable } from '../../node/variable.ts'
import type { CodeFile } from '../../type/code-file.ts'
import { parseBracket } from './parse-bracket.ts'
import type { Rule } from './type.ts'
import { ADVANCED_RULES, BASIC_RULES } from './rule/index.ts'

/**
 * 파싱 결과를 담는 객체입니다.
 */
interface ParseResult {
    ast: Block
    exportedRules: Rule[]
    computedRules: Rule[]
}

/**
 * `CodeFile`에 포함된 토큰들을 파싱하여 추상 구문 트리(AST)를 생성합니다.
 */
export function parse(codeFile: CodeFile, optimistic = false): ParseResult {
    try {
        const { rules: dynamicRules, localRules } = createDynamicRule(codeFile)
        const nodes = convertTokensToNodes(codeFile.tokens)
        const indentedNodes = parseIndent(nodes)

        const priorityParsedNodes = parseBracket(
            indentedNodes,
            dynamicRules,
            optimistic,
        )

        const computedRules = [
            dynamicRules.flat().flat(),
            localRules.flat().flat(),
            ADVANCED_RULES.flat(),
            BASIC_RULES.flat(),
        ].flat()

        const childNodes = callParseRecursively(
            priorityParsedNodes,
            dynamicRules,
        )

        const ast = new Block(childNodes, codeFile.tokens)

        const exportedDynamicRules = [
            ...localRules[0].flat(),
            ...localRules[1].flat(),
        ]
        const exportedRules: Rule[] = [
            ...exportedDynamicRules,
            ...extractExportedVariables(childNodes),
        ]

        return {
            ast,
            exportedRules,
            computedRules,
        }
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
                        return nodes[0]
                    },
                    config: {
                        exported: true,
                    },
                }) as Rule,
        )
}
