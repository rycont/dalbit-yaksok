import type { CodeFile } from '../../type/code-file.ts'
import type { Node } from '../../node/base.ts'
import { Block, Evaluable, Expression, Identifier } from '../../node/index.ts'
import { type Token, TOKEN_TYPE } from '../tokenize/token.ts'
import type { DynamicRulePattern } from './dynamicRule/index.ts'

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
                if (classNameNode)
                    detectedIdentifierNames.push(classNameNode.value)
            } else {
                detectedPatterns.push(
                    ...functionHeaderAfterDeclaration.map((suffix) => ({
                        suffix,
                        next: null,
                    })),
                )
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
                    (candidate): candidate is { headPart: string; pattern: DynamicRulePattern } =>
                        candidate !== null,
                )

            if (candidates.length === 0) {
                cursor++
                continue
            }

            const validCandidates = candidates.filter(({ pattern }) => {
                if (pattern.next === null) return true

                const nextNode = nodes[cursor + 1]
                if (!nextNode) return false

                if (pattern.next === 'parameter') {
                    return nextNode instanceof Evaluable
                }

                return (
                    nextNode instanceof Identifier &&
                    nextNode.value === pattern.next
                )
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
