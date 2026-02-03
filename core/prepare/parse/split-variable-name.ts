import type { CodeFile } from '../../type/code-file.ts'
import type { Node } from '../../node/base.ts'
import { Block, Expression, Identifier, Sequence } from '../../node/index.ts'
import { type Token, TOKEN_TYPE } from '../tokenize/token.ts'

export function splitVariableName(
    nodes: Node[],
    codeFile?: CodeFile,
    inheritedIdentifiers: string[] = [],
    inheritedFunctionHeaders: string[] = [],
    depth = 0,
): Node[] {
    let cursor = 0

    const detectedFunctionHeaderAfterParameter: string[] = [
        ...inheritedFunctionHeaders,
    ]
    const detectedIdentifierNames: string[] = [...inheritedIdentifiers]

    while (cursor < nodes.length) {
        const currentNode = nodes[cursor]

        const isIdentifier = currentNode instanceof Identifier

        if (
            isIdentifier &&
            (currentNode.value === '약속' || currentNode.value === '클래스') &&
            currentNode.tokens[0].position.column - 1 === depth * 4
        ) {
            const blockIndex = nodes.slice(cursor).findIndex((node) => node instanceof Block)
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
                if (classNameNode) detectedIdentifierNames.push(classNameNode.value)
            } else {
                detectedFunctionHeaderAfterParameter.push(
                    ...functionHeaderAfterDeclaration,
                )
            }

            splitVariableName(
                nextNode.children,
                codeFile,
                [...detectedIdentifierNames, ...parameterNames],
                detectedFunctionHeaderAfterParameter,
                depth + 1,
            )

            cursor = yaksokEndIndex + 2
            continue
        } else if (isIdentifier) {
            const trailingFunctionHeaders =
                detectedFunctionHeaderAfterParameter.filter(
                    (header) =>
                        currentNode.value.length > header.length &&
                        currentNode.value.endsWith(header),
                )

            if (trailingFunctionHeaders.length === 0) {
                cursor++
                continue
            }

            const candidates = trailingFunctionHeaders
                .map((functionName) => {
                    const headPart = currentNode.value.slice(
                        0,
                        -functionName.length,
                    )
                    if (detectedIdentifierNames.includes(headPart)) {
                        return [headPart, functionName]
                    }
                    return null
                })
                .filter((candidate): candidate is string[] => candidate !== null)

            if (candidates.length === 0) {
                cursor++
                continue
            }

            const [variable, functionName] = candidates.toSorted(
                (a, b) => b[0].length - a[0].length,
            )[0]

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
            currentNode instanceof Expression &&
            currentNode.value === '='
        ) {
            const prevNode = nodes[cursor - 1]
            if (prevNode instanceof Identifier) {
                detectedIdentifierNames.push(prevNode.value)
            }
        } else if (
            currentNode instanceof Identifier &&
            currentNode.value === '새' &&
            nodes[cursor + 1] instanceof Identifier
        ) {
            // "새 클래스이름" -> 클래스 이름을 식별자 목록에 추가 (동적 인식 지원)
            detectedIdentifierNames.push((nodes[cursor + 1] as Identifier).value)
        } else if (currentNode instanceof Block) {
            currentNode.children = splitVariableName(
                currentNode.children,
                codeFile,
                detectedIdentifierNames,
                detectedFunctionHeaderAfterParameter,
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
