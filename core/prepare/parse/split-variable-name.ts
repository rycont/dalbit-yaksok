import type { CodeFile } from '../../type/code-file.ts'
import type { Node } from '../../node/base.ts'
import {
    Block,
    EOL,
    Evaluable,
    Expression,
    Identifier,
    Sequence,
    SetVariable,
    ValueWithParenthesis,
} from '../../node/index.ts'
import { type Token, TOKEN_TYPE } from '../tokenize/token.ts'
import type { DynamicRulePattern } from './dynamicRule/index.ts'

/**
 * 한국어 조사가 붙은 변수명을 변수와 조사로 분리합니다.
 */
export function splitVariableName(
    nodes: Node[],
    codeFile?: CodeFile,
    inheritedIdentifiers: string[] = [],
    inheritedPatterns: DynamicRulePattern[] = [],
    depth = 0,
): Node[] {
    const resultNodes: Node[] = []
    let cursor = 0

    const detectedPatterns: DynamicRulePattern[] = [
    ...inheritedPatterns,
    { suffix: '의', next: 'parameter' },
    { suffix: '마다', next: ':' },
    { suffix: '마다', next: '반복' },
    { suffix: '마다', next: '반복하기' },
    { suffix: '마다', next: null },
]
    const detectedIdentifierNames: string[] = [
        ...inheritedIdentifiers,
        ...collectIdentifiersInBlock(nodes),
    ]

    while (cursor < nodes.length) {
        const currentNode = nodes[cursor]

        if (currentNode instanceof Block) {
            currentNode.children = splitVariableName(
                currentNode.children,
                codeFile,
                detectedIdentifierNames,
                detectedPatterns,
                depth + 1,
            )
            resultNodes.push(currentNode)
            cursor++
            continue
        }

        const isIdentifier = currentNode instanceof Identifier

        if (
            isIdentifier &&
            (currentNode.value === '약속' || currentNode.value === '클래스') &&
            currentNode.tokens[0].position.column - 1 === depth * 4
        ) {
            const blockIndex = nodes
                .slice(cursor)
                .findIndex((node) => node instanceof Block)
            
            if (blockIndex !== -1) {
                const declaration = nodes.slice(cursor, cursor + blockIndex)
                const nameNode = declaration.find(
                    (node) =>
                        node instanceof Identifier &&
                        node.value !== '약속' &&
                        node.value !== '클래스',
                ) as Identifier
                if (nameNode) {
                    detectedIdentifierNames.push(nameNode.value)
                }
            }
            
            resultNodes.push(currentNode)
            cursor++
            continue
        }

        if (isIdentifier) {
            const prevNode = resultNodes[resultNodes.length - 1]
            if (prevNode instanceof Expression && prevNode.value === '.') {
                resultNodes.push(currentNode)
                cursor++
                continue
            }

            const candidates = detectedPatterns
                .filter((p) => currentNode.value.endsWith(p.suffix))
                .map((pattern) => {
                    const headPart = currentNode.value.slice(0, -pattern.suffix.length)
                    if (headPart && (detectedIdentifierNames.includes(headPart) || pattern.suffix === '의' || pattern.suffix === '마다')) {
                        return { headPart, pattern }
                    }
                    return null
                })
                .filter((c): c is { headPart: string; pattern: DynamicRulePattern } => c !== null)

            if (candidates.length > 0) {
                const validCandidates = candidates.filter(({ pattern }) => {
                    if (pattern.next === null) return true
                    
                    let lookaheadCursor = cursor + 1
                    while (
                        lookaheadCursor < nodes.length &&
                        (nodes[lookaheadCursor] instanceof EOL ||
                            (nodes[lookaheadCursor] instanceof Expression &&
                                [' ', ',', '(', ')'].includes(nodes[lookaheadCursor].value as string)))
                    ) {
                        lookaheadCursor++
                    }

                    const nextNode = nodes[lookaheadCursor]
                    if (!nextNode) return false

                    if (pattern.next === 'parameter') {
                        return (
                            nextNode instanceof Evaluable ||
                            nextNode instanceof Identifier ||
                            nextNode instanceof ValueWithParenthesis ||
                            nextNode instanceof Sequence
                        )
                    }
                    return (
                        (nextNode instanceof Identifier || nextNode instanceof Expression) &&
                        nextNode.value === pattern.next
                    )
                })

                if (validCandidates.length > 0) {
                    const { headPart: variable, pattern } = validCandidates.toSorted(
                        (a, b) => b.headPart.length - a.headPart.length,
                    )[0]

                    const originalToken = currentNode.tokens[0]
                    const variableToken: Token = { ...originalToken, value: variable }
                    const functionToken: Token = {
                        ...originalToken,
                        value: pattern.suffix,
                        position: {
                            ...originalToken.position,
                            column: originalToken.position.column + variable.length,
                        },
                    }

                    resultNodes.push(new Identifier(variable, [variableToken]))
                    resultNodes.push(new Identifier(pattern.suffix, [functionToken]))
                    cursor++
                    continue
                }
            }
        }

        resultNodes.push(currentNode)
        cursor++
    }

    return resultNodes
}

function collectIdentifiersInBlock(nodes: Node[]): string[] {
    const identifiers: string[] = []
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node instanceof SetVariable) {
            identifiers.push(node.name)
        } else if (node instanceof Expression && node.value === '=') {
            const prevNode = nodes[i - 1]
            if (prevNode instanceof Identifier) {
                const prevPrevNode = nodes[i - 2]
                if (!(prevPrevNode instanceof Expression && prevPrevNode.value === '.')) {
                    identifiers.push(prevNode.value)
                }
            }
        } else if (node instanceof Identifier && node.value === '람다') {
            let lambdaCursor = i + 1
            while (
                lambdaCursor < nodes.length &&
                (nodes[lambdaCursor] instanceof Identifier ||
                    (nodes[lambdaCursor] instanceof Expression && nodes[lambdaCursor].value === ','))
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
