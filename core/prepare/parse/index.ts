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
import { splitVariableName } from './split-variable-name.ts'

/**
 * 파싱 결과를 담는 객체입니다.
 */
interface ParseResult {
    ast: Block
    exportedRules: Rule[]
}

/**
 * `CodeFile`에 포함된 토큰들을 파싱하여 추상 구문 트리(AST)를 생성합니다.
 */
export function parse(codeFile: CodeFile, optimistic = false): ParseResult {
    try {
        const { rules: dynamicRules, patterns } = createDynamicRule(codeFile)
        const nodes = convertTokensToNodes(codeFile.tokens)
        const indentedNodes = parseIndent(nodes)

        const priorityParsedNodes = codeFile.session?.flags[
            'disable-bracket-first-parsing'
        ]
            ? indentedNodes
            : parseBracket(
                  indentedNodes,
                  codeFile.tokens,
                  dynamicRules,
                  optimistic,
              )

        // 조사 분리 (lookahead)
        const variableNameSplitNodes = splitVariableName(
            priorityParsedNodes,
            codeFile,
            [],
            patterns,
        )

        // 중요: 조사 분리 후에 노드들의 토큰 정보를 기반으로 전체 토큰 배열을 갱신합니다.
        const updatedTokens = getTokensFromNodes(variableNameSplitNodes)
        codeFile.tokens = updatedTokens

        const childNodes = callParseRecursively(
            variableNameSplitNodes,
            dynamicRules,
        )

        const ast = new Block(childNodes, updatedTokens)

        const exportedDynamicRules = dynamicRules.flat(2)
        const exportedRules: Rule[] = [
            ...exportedDynamicRules,
            ...extractExportedVariables(childNodes),
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
                        return nodes[0]
                    },
                    config: {
                        exported: true,
                    },
                }) as Rule,
        )
}
