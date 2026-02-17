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
    /**
     * 파싱 결과로 생성된 최상위 추상 구문 트리(AST) 블록입니다.
     * @see Block
     */
    ast: Block
    /**
     * 해당 코드 파일에서 `내보내기`로 선언된 변수나 함수를 다른 파일에서 불러올 수 있도록
     * 동적으로 생성된 파서 규칙(Rule)의 리스트입니다.
     * @see Rule
     */
    exportedRules: Rule[]
}

/**
 * `CodeFile`에 포함된 토큰들을 파싱하여 추상 구문 트리(AST)를 생성합니다.
 * 파싱은 토큰 목록을 바탕으로 코드의 문법적 구조를 분석하고 계층적인 트리 구조로 변환하는 과정입니다.
 *
 * 이 함수는 다음과 같은 내부 단계를 거칩니다:
 * 1. `createDynamicRule`: 현재 파일 및 의존성에서 `내보내기`된 것들을 기반으로 동적 파싱 규칙을 생성합니다.
 * 2. `convertTokensToNodes`: 1차적으로 토큰을 기본적인 노드(Node)로 변환합니다.
 * 3. `parseIndent`: 들여쓰기를 기반으로 코드 블록의 계층 구조를 파악합니다.
 * 4. `parseBracket`: 괄호(`()`, `[]`, `{}`) 안의 표현식을 먼저 파싱하여 처리합니다.
 * 5. `callParseRecursively`: Shift-Reduce 파싱 알고리즘을 사용하여 최종 AST를 구성합니다.
 *
 * @param codeFile - 파싱할 코드를 담고 있는 `CodeFile` 객체입니다. 토큰 정보와 세션 컨텍스트를 제공합니다.
 * @param optimistic - `true`로 설정하면 일부 파싱 오류를 무시하고 AST를 최대한 생성하려고 시도합니다. 주로 언어 서버(LSP)에서 불완전한 코드를 분석할 때 사용됩니다.
 * @returns 파싱 결과로 생성된 AST와 내보내기 규칙을 포함하는 `ParseResult` 객체를 반환합니다.
 * @see CodeFile
 * @see ParseResult
 *
 * @example
 * ```ts
 * // (개념적인 예시)
 * // 실제 사용 시에는 YaksokSession을 통해 CodeFile이 관리됩니다.
 * const session = new YaksokSession();
 * session.addModule('main', '"안녕" 보여주기');
 * const codeFile = session.getCodeFile('main');
 *
 * // CodeFile은 내부적으로 토크나이저를 호출하여 토큰을 생성합니다.
 * // codeFile.tokenize();
 *
 * // 그 다음 parse 함수가 호출되어 AST를 생성합니다.
 * const { ast, exportedRules } = parse(codeFile);
 *
 * console.log(ast); // 프로그램의 구조를 나타내는 Block 노드
 * ```
 */
export function parse(codeFile: CodeFile, optimistic = false): ParseResult {
    try {
        const { rules: dynamicRules, patterns } =
            createDynamicRule(codeFile)
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

        const variableNameSplitNodes = splitVariableName(
            priorityParsedNodes,
            codeFile,
            [],
            patterns,
        )

        const childNodes = callParseRecursively(
            variableNameSplitNodes,
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
                }) satisfies Rule,
        )
}
