import type { CodeFile } from '../../type/code-file.ts'
import type { Node } from '../../node/base.ts'
import {
    Block,
    EOL,
    Evaluable,
    Expression,
    Identifier,
    Sequence,
    ValueWithParenthesis,
} from '../../node/index.ts'
import { type Token, TOKEN_TYPE } from '../tokenize/token.ts'
import type { DynamicRulePattern } from './dynamicRule/index.ts'

/**
 * 한국어 조사가 붙은 변수명을 변수와 조사로 분리합니다.
 *
 * 이 함수는 '달빛 약속'의 핵심 기능 중 하나로, 한국어 자연어 문법을 지원하기 위해
 * 변수명에 붙은 조사(을/를, 이/가, 와/과 등)를 자동으로 분리합니다.
 *
 * @example
 * ```
 * // 입력: "사람을 칭찬하기"
 * // "사람을"이 변수 "사람"과 조사 "을"로 분리됨
 * 사람 = "철수"
 * 사람을 칭찬하기  // → 사람 + 을 + 칭찬하기
 * ```
 *
 * **알고리즘 개요:**
 * 1. 선언된 변수명 목록(`detectedIdentifierNames`)을 수집
 * 2. 함수 호출 패턴(`detectedPatterns`)에서 가능한 조사 접미사 추출
 * 3. 각 식별자가 "변수명 + 조사" 형태인지 검증
 * 4. Lookahead를 통해 다음 토큰이 패턴과 일치하는지 확인
 * 5. 조건을 만족하면 하나의 토큰을 두 개로 분리
 *
 * **엄밀한 검증:**
 * - 변수가 실제로 선언되었는지 확인 (`detectedIdentifierNames`)
 * - 다음에 올 토큰이 함수 패턴과 일치하는지 검증 (`pattern.next`)
 * - 대입 연산자(`=`) 앞에서는 분리하지 않음 (예: `사람은 = "철수"`)
 *
 * @param nodes - 파싱할 노드 배열
 * @param codeFile - 현재 코드 파일 (토큰 배열 수정용)
 * @param inheritedIdentifiers - 상위 스코프에서 상속받은 변수명 목록
 * @param inheritedPatterns - 상위 스코프에서 상속받은 함수 패턴 목록
 * @param depth - 현재 들여쓰기 깊이 (함수/클래스 블록 추적용)
 * @returns 조사가 분리된 노드 배열
 */
export function splitVariableName(
    nodes: Node[],
    codeFile?: CodeFile,
    inheritedIdentifiers: string[] = [],
    inheritedPatterns: DynamicRulePattern[] = [],
    depth = 0,
): Node[] {
    let cursor = 0

    const detectedPatterns: DynamicRulePattern[] = [...inheritedPatterns]
    const detectedIdentifierNames: string[] = [
        ...inheritedIdentifiers,
        ...collectIdentifiersInBlock(nodes),
    ]

    while (cursor < nodes.length) {
        const currentNode = nodes[cursor]

        const isIdentifier = currentNode instanceof Identifier

        if (
            isIdentifier &&
            (currentNode.value === '약속' || currentNode.value === '클래스') &&
            currentNode.tokens[0].position.column - 1 === depth * 4
        ) {
            const blockIndex = nodes
                .slice(cursor)
                .findIndex((node) => node instanceof Block)
            if (blockIndex === -1) {
                cursor++
                continue
            }

            const yaksokEndIndex = cursor + blockIndex - 1

            const nextNode = nodes[yaksokEndIndex + 1]
            if (!(nextNode instanceof Block)) {
                cursor++
                continue
            }

            const yaksokDeclaration = nodes.slice(cursor, yaksokEndIndex + 1)
            const parameterNames =
                getParameterNameFromFunctionDeclaration(yaksokDeclaration)

            const functionHeaderAfterDeclaration =
                extractFunctionHeaderAfterParameter(yaksokDeclaration)

            if (currentNode.value === '클래스') {
                const classNameNode = yaksokDeclaration.find(
                    (node) =>
                        node instanceof Identifier && node.value !== '클래스',
                ) as Identifier
                if (classNameNode) {
                    detectedIdentifierNames.push(classNameNode.value)
                }
            }

            splitVariableName(
                nextNode.children,
                codeFile,
                [...detectedIdentifierNames, ...parameterNames],
                detectedPatterns,
                depth + 1,
            )

            cursor = yaksokEndIndex + 2
            continue
        } else if (
            currentNode instanceof Identifier &&
            currentNode.value === '새' &&
            nodes[cursor + 1] instanceof Identifier
        ) {
            detectedIdentifierNames.push(
                (nodes[cursor + 1] as Identifier).value,
            )
            cursor++
            continue
        } else if (isIdentifier) {
            const candidates = detectedPatterns
                .filter(
                    (p) =>
                        currentNode.value.length > p.suffix.length &&
                        currentNode.value.endsWith(p.suffix),
                )
                .map((pattern) => {
                    const headPart = currentNode.value.slice(
                        0,
                        -pattern.suffix.length,
                    )
                    if (detectedIdentifierNames.includes(headPart)) {
                        return { headPart, pattern }
                    }
                    return null
                })
                .filter(
                    (
                        candidate,
                    ): candidate is {
                        headPart: string
                        pattern: DynamicRulePattern
                    } => candidate !== null,
                )

            if (candidates.length === 0) {
                cursor++
                continue
            }

            const validCandidates = candidates.filter(({ pattern }) => {
                if (pattern.next === null) return true

                let lookaheadCursor = cursor + 1
                while (
                    lookaheadCursor < nodes.length &&
                    (nodes[lookaheadCursor] instanceof EOL ||
                        (nodes[lookaheadCursor] instanceof Expression &&
                            pattern.next !== nodes[lookaheadCursor].value &&
                            [' ', ',', '(', ')'].includes(
                                (nodes[lookaheadCursor] as Expression).value,
                            )))
                ) {
                    lookaheadCursor++
                }

                const nextNode = nodes[lookaheadCursor]
                if (!nextNode) return false

                if (pattern.next === 'parameter') {
                    // If 'parameter' is expected, any evaluable node is valid
                    return (
                        nextNode instanceof Evaluable ||
                        nextNode instanceof Identifier ||
                        nextNode instanceof ValueWithParenthesis ||
                        nextNode instanceof Sequence
                    )
                } else {
                    // Otherwise, expect a specific string marker
                    return (
                        (nextNode instanceof Identifier ||
                            nextNode instanceof Expression) &&
                        nextNode.value === pattern.next
                    )
                }
            })

            if (validCandidates.length === 0) {
                cursor++
                continue
            }

            const { headPart: variable, pattern } = validCandidates.toSorted(
                (a, b) => b.headPart.length - a.headPart.length,
            )[0]

            const functionName = pattern.suffix

            const variableToken = {
                type: TOKEN_TYPE.IDENTIFIER,
                value: variable,
                position: currentNode.tokens[0].position,
            } as Token

            const functionToken = {
                type: TOKEN_TYPE.IDENTIFIER,
                value: functionName,
                position: {
                    line: currentNode.tokens[0].position.line,
                    column:
                        currentNode.tokens[0].position.column + variable.length,
                },
            } as Token

            nodes.splice(
                cursor,
                1,
                new Identifier(variable, [variableToken]),
                new Identifier(functionName, [functionToken]),
            )

            if (codeFile) {
                const tokenIndex = codeFile.tokens.indexOf(
                    currentNode.tokens[0],
                )

                codeFile.tokens.splice(
                    tokenIndex,
                    1,
                    variableToken,
                    functionToken,
                )
            }

            cursor++
            continue
        } else if (
            currentNode instanceof Identifier &&
            currentNode.value === '람다'
        ) {
            let lambdaCursor = cursor + 1
            while (
                lambdaCursor < nodes.length &&
                (nodes[lambdaCursor] instanceof Identifier ||
                    (nodes[lambdaCursor] instanceof Expression &&
                        nodes[lambdaCursor].value === ','))
            ) {
                if (nodes[lambdaCursor] instanceof Identifier) {
                    detectedIdentifierNames.push(
                        (nodes[lambdaCursor] as Identifier).value,
                    )
                }
                lambdaCursor++
            }
        } else if (
            currentNode instanceof Expression &&
            currentNode.value === '='
        ) {
            const prevNode = nodes[cursor - 1]
            if (prevNode instanceof Identifier) {
                detectedIdentifierNames.push(prevNode.value)
            }
        } else if (currentNode instanceof Block) {
            currentNode.children = splitVariableName(
                currentNode.children,
                codeFile,
                detectedIdentifierNames,
                detectedPatterns,
                depth + 1,
            )
        }

        cursor++
    }

    return nodes
}

/**
 * 함수 선언에서 괄호 뒤에 오는 식별자들을 추출합니다.
 * 예: `약속, (사람)을 (표현)으로 칭찬하기` → ["을", "으로", "칭찬하기"]
 */
function extractFunctionHeaderAfterParameter(declaration: Node[]): string[] {
    const parameterNames: string[] = []

    for (let i = 0; i < declaration.length; i++) {
        const node = declaration[i]

        if (node instanceof Expression && node.value === ')') {
            const nextNode = declaration[i + 1]
            if (nextNode instanceof Identifier) {
                parameterNames.push(...nextNode.value.split('/'))
            }
        }
    }

    return parameterNames
}

/**
 * 함수 선언에서 괄호 안의 매개변수 이름들을 추출합니다.
 * 예: `약속, (사람)을 (표현)으로 칭찬하기` → ["사람", "표현"]
 */
function getParameterNameFromFunctionDeclaration(
    declaration: Node[],
): string[] {
    const parameterNames: string[] = []

    for (let i = 0; i < declaration.length; i++) {
        const node = declaration[i]

        if (node instanceof Expression && node.value === '(') {
            const nextNode = declaration[i + 1]
            if (nextNode instanceof Identifier) {
                parameterNames.push(nextNode.value)
            }
        }
    }

    return parameterNames
}

/**
 * 블록 내에서 선언된 모든 변수명을 수집합니다.
 * 대입문(`=`), 람다 매개변수, 클래스 인스턴스 등을 탐지합니다.
 */
function collectIdentifiersInBlock(nodes: Node[]): string[] {
    const identifiers: string[] = []

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]

        if (node instanceof Expression && node.value === '=') {
            const prevNode = nodes[i - 1]
            if (prevNode instanceof Identifier) {
                identifiers.push(prevNode.value)
            }
        } else if (node instanceof Identifier && node.value === '람다') {
            let lambdaCursor = i + 1
            while (
                lambdaCursor < nodes.length &&
                (nodes[lambdaCursor] instanceof Identifier ||
                    (nodes[lambdaCursor] instanceof Expression &&
                        nodes[lambdaCursor].value === ','))
            ) {
                if (nodes[lambdaCursor] instanceof Identifier) {
                    identifiers.push((nodes[lambdaCursor] as Identifier).value)
                }
                lambdaCursor++
            }
        } else if (
            node instanceof Identifier &&
            node.value === '새' &&
            nodes[i + 1] instanceof Identifier
        ) {
            identifiers.push((nodes[i + 1] as Identifier).value)
        }
    }

    return identifiers
}
