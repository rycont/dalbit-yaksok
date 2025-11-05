import {
    Block,
    DeclareFunction,
    EOL,
    Formula,
    FunctionInvoke,
    Identifier,
    IfStatement,
    IndexFetch,
    ListLiteral,
    ListLoop,
    Node,
    NotExpression,
    NumberLiteral,
    Operator,
    Print,
    ReturnStatement,
    SetToIndex,
    SetVariable,
    StringLiteral,
    TOKEN_TYPE,
    ValueWithParenthesis,
    CountLoop,
} from '@dalbit-yaksok/core'
import { ColorPart } from '../type.ts'
import { parseFunctionDeclareHeader } from './declare-function.ts'
import { parseListLoopHeader } from './list-loop.ts'
import { SCOPE } from './scope.ts'

/**
 * 코드 에디터에서 문법 강조 기능을 구현할 수 있도록, AST 노드를 색상 토큰으로 변환합니다. `Node`를 받아서 `ColorPart[]`를 반환합니다.
 *
 * @example
 * ```ts
 * const code = `"안녕!" 보여주기`
 * const { ast } = new CodeFile(code)
 *
 * const colorTokens = nodeToColorTokens(ast) // [!code highlight]
 * console.log(colorTokens)
 * ```
 *
 * @param node 색상 토큰으로 변환할 AST 노드
 * @returns {ColorPart[]} 추출된 색상 토큰
 */
function node(node: Node): ColorPart[] {
    if (node instanceof Block) {
        return block(node)
    }

    if (node instanceof DeclareFunction) {
        return declareFunction(node)
    }

    if (node instanceof SetVariable) {
        return setVariable(node)
    }

    if (node instanceof Identifier) {
        return identifier(node)
    }

    if (node instanceof Print) {
        return visitPrint(node)
    }

    if (node instanceof Formula) {
        return formula(node)
    }

    if (node instanceof Operator) {
        return operator(node)
    }

    if (node instanceof ValueWithParenthesis) {
        return valueWithParenthesis(node)
    }

    if (node instanceof NumberLiteral) {
        return numberLiteral(node)
    }

    if (node instanceof FunctionInvoke) {
        return functionInvoke(node)
    }

    if (node instanceof StringLiteral) {
        return stringLiteral(node)
    }

    if (node instanceof IfStatement) {
        return ifStatement(node)
    }

    if (node instanceof ListLoop) {
        return listLoop(node)
    }

    if (node instanceof ListLiteral) {
        return listLiteral(node)
    }

    if (node instanceof IndexFetch) {
        return indexFetch(node)
    }

    if (node instanceof SetToIndex) {
        return setToIndex(node)
    }

    if (node instanceof ReturnStatement) {
        return visitReturn(node)
    }

    if (node instanceof EOL) {
        return []
    }

    if (node instanceof NotExpression) {
        return visitNotExpression(node)
    }

    if (node instanceof CountLoop) {
        return visitCountLoop(node)
    }

    console.log('Unknown node:', node)

    return []
}

function block(ast: Block): ColorPart[] {
    return ast.children.flatMap(node)
}

function declareFunction(current: DeclareFunction) {
    const headerParts: ColorPart[] = parseFunctionDeclareHeader(current.tokens)
    return headerParts.concat(block(current.body))
}

function setVariable(current: SetVariable) {
    const firstIdentifier = current.tokens.find(
        (token) => token.type === TOKEN_TYPE.IDENTIFIER,
    )

    const assignerToken = current.tokens.find(
        (token) => token.type === TOKEN_TYPE.ASSIGNER,
    )

    const variableName: ColorPart[] = [
        {
            position: firstIdentifier!.position,
            scopes: SCOPE.VARIABLE_NAME,
        },
        {
            position: assignerToken!.position,
            scopes: SCOPE.PUNCTUATION,
        },
    ]

    return variableName.concat(node(current.value))
}

function identifier(current: Identifier) {
    return [
        {
            position: current.tokens[0].position,
            scopes: SCOPE.IDENTIFIER,
        },
    ]
}

function visitPrint(current: Print) {
    const child = node(current.value)

    return child.concat([
        {
            position: current.tokens.slice(-1)[0].position,
            scopes: SCOPE.KEYWORD,
        },
    ])
}

function formula(current: Formula) {
    return current.terms.flatMap(node)
}

function operator(current: Operator) {
    return [
        {
            position: current.tokens[0].position,
            scopes: SCOPE.OPERATOR,
        },
    ]
}

function valueWithParenthesis(current: ValueWithParenthesis): ColorPart[] {
    return [
        {
            position: current.tokens[0].position,
            scopes: SCOPE.PARENTHESIS,
        } as ColorPart,
    ]
        .concat(node(current.value))
        .concat([
            {
                position: current.tokens.slice(-1)[0].position,
                scopes: SCOPE.PARENTHESIS,
            },
        ])
}

function numberLiteral(current: NumberLiteral): ColorPart[] {
    return [
        {
            position: current.tokens[0].position,
            scopes: SCOPE.NUMBER,
        },
    ]
}

function functionInvoke(current: FunctionInvoke): ColorPart[] {
    let isInParameter = false

    let colorParts: ColorPart[] = []

    for (let i = 0; i < current.tokens.length; i++) {
        const token = current.tokens[i]

        if (token.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
            isInParameter = true

            colorParts.push({
                position: token.position,
                scopes: SCOPE.PARENTHESIS,
            })

            continue
        }

        if (token.type === TOKEN_TYPE.CLOSING_PARENTHESIS) {
            isInParameter = false

            colorParts.push({
                position: token.position,
                scopes: SCOPE.PARENTHESIS,
            })

            continue
        }

        if (isInParameter) {
            continue
        }

        colorParts.push({
            position: token.position,
            scopes: SCOPE.CALLABLE,
        })
    }

    for (const paramName in current.params) {
        colorParts = colorParts.concat(node(current.params[paramName]))
    }

    return colorParts
}

function stringLiteral(current: StringLiteral): ColorPart[] {
    return [
        {
            position: current.tokens[0].position,
            scopes: SCOPE.STRING,
        },
    ]
}

function ifStatement(current: IfStatement): ColorPart[] {
    let colorParts: ColorPart[] = [
        {
            position: current.tokens[0].position,
            scopes: SCOPE.KEYWORD,
        },
    ]

    for (const caseBlock of current.cases) {
        if (caseBlock.condition) {
            if (caseBlock.condition.tokens) {
                const conditionStartTokenIndex = current.tokens.indexOf(
                    caseBlock.condition.tokens[0],
                )

                const conditionEndTokenIndex = current.tokens.indexOf(
                    caseBlock.condition.tokens.slice(-1)[0],
                )

                const beforeConditionIdentifier = current.tokens
                    .slice(0, conditionStartTokenIndex)
                    .findLast((token) => token.type === TOKEN_TYPE.IDENTIFIER)

                if (beforeConditionIdentifier) {
                    colorParts.push({
                        position: beforeConditionIdentifier.position,
                        scopes: SCOPE.KEYWORD,
                    })
                }

                const afterConditionIdentifier = current.tokens
                    .slice(conditionEndTokenIndex + 1)
                    .find((token) => token.type === TOKEN_TYPE.IDENTIFIER)

                if (afterConditionIdentifier) {
                    colorParts.push({
                        position: afterConditionIdentifier.position,
                        scopes: SCOPE.KEYWORD,
                    })
                }
            }

            colorParts = colorParts.concat(node(caseBlock.condition))
        } else {
            const bodyStartTokenIndex = current.tokens.indexOf(
                caseBlock.body.tokens[0],
            )

            const beforeBodyIdentifier = current.tokens
                .slice(0, bodyStartTokenIndex)
                .findLast((token) => token.type === TOKEN_TYPE.IDENTIFIER)

            if (beforeBodyIdentifier) {
                colorParts.push({
                    position: beforeBodyIdentifier.position,
                    scopes: SCOPE.KEYWORD,
                })
            }
        }

        colorParts = colorParts.concat(block(caseBlock.body))
    }

    return colorParts
}

function listLoop(current: ListLoop): ColorPart[] {
    let colorParts = parseListLoopHeader(current)

    colorParts = colorParts.concat(node(current.list))
    colorParts = colorParts.concat(block(current.body))

    return colorParts
}

function listLiteral(current: ListLiteral): ColorPart[] {
    const itemTokens = new Set(current.items.flatMap((item) => item.tokens))
    const allTokens = new Set(current.tokens)

    const nonItemTokens = allTokens.difference(itemTokens)
    const commas = Array.from(nonItemTokens).filter(
        (token) => token.type === TOKEN_TYPE.COMMA,
    )

    let listColorParts: ColorPart[] = []

    listColorParts.push({
        position: current.tokens[0].position,
        scopes: SCOPE.PARENTHESIS,
    })

    const commaColorParts: ColorPart[] = commas.map((comma) => ({
        position: comma.position,
        scopes: SCOPE.PUNCTUATION,
    }))

    listColorParts = listColorParts.concat(commaColorParts)

    listColorParts.push({
        position: current.tokens.slice(-1)[0].position,
        scopes: SCOPE.PARENTHESIS,
    })

    const itemColorParts = current.items.flatMap(node)

    const colorParts = listColorParts.concat(itemColorParts)

    return colorParts
}

function indexFetch(current: IndexFetch): ColorPart[] {
    let colorParts: ColorPart[] = []

    colorParts = colorParts.concat(node(current.list))
    colorParts = colorParts.concat(node(current.index))

    return colorParts
}

function setToIndex(current: SetToIndex): ColorPart[] {
    let colorParts: ColorPart[] = []

    colorParts = colorParts.concat(node(current.target))
    colorParts = colorParts.concat(node(current.value))

    return colorParts
}

function visitReturn(current: ReturnStatement): ColorPart[] {
    const lastTokenPosition = current.tokens[current.tokens.length - 1].position

    const valueColorParts = current.value ? node(current.value) : []
    const keywordColorPart: ColorPart[] = [
        {
            position: lastTokenPosition,
            scopes: SCOPE.KEYWORD,
        },
    ]

    return valueColorParts.concat(keywordColorPart)
}

function visitNotExpression(current: NotExpression): ColorPart[] {
    return [
        {
            position: current.tokens[0].position,
            scopes: SCOPE.OPERATOR,
        } as ColorPart,
    ].concat(node(current.value))
}

function visitCountLoop(current: CountLoop): ColorPart[] {
    let colorParts: ColorPart[] = []

    colorParts = colorParts.concat(node(current.count))
    colorParts = colorParts.concat(node(current.body))

    return colorParts
}

export { node as nodeToColorTokens }
