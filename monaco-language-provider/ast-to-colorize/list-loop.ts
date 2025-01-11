import { ListLoop, TOKEN_TYPE } from '@dalbit-yaksok/core'
import { ColorPart } from '../type.ts'
import { SCOPE } from './scope.ts'

export function parseListLoopHeader(node: ListLoop) {
    const colorParts: ColorPart[] = [
        {
            position: node.tokens[0].position,
            scopes: SCOPE.KEYWORD,
        },
    ]

    const newLineIndex = node.tokens.findIndex(
        (token) => token.type === TOKEN_TYPE.NEW_LINE,
    )

    const listLoopHeaderTokens = node.tokens.slice(1, newLineIndex)

    const listLoopHeaderEnder: ColorPart = {
        position:
            listLoopHeaderTokens[listLoopHeaderTokens.length - 1].position,
        scopes: SCOPE.KEYWORD,
    }

    colorParts.push(listLoopHeaderEnder)

    const indexVariableName = node.variableName

    const variableNameToken = listLoopHeaderTokens.find(
        (token) => token.value === indexVariableName,
    )

    if (variableNameToken) {
        const variableNameColorPart: ColorPart = {
            position: variableNameToken.position,
            scopes: SCOPE.VARIABLE_NAME,
        }

        colorParts.push(variableNameColorPart)
    }

    const listEndingToken = node.list.tokens?.[node.list.tokens.length - 1]
    if (listEndingToken) {
        const listEndingTokenIndex =
            listLoopHeaderTokens.indexOf(listEndingToken)

        const afterListIdentifier = listLoopHeaderTokens
            .slice(listEndingTokenIndex + 1)
            .find((token) => token.type === TOKEN_TYPE.IDENTIFIER)

        if (afterListIdentifier && afterListIdentifier.value === '의') {
            const inKeywordIdentifier: ColorPart = {
                position: afterListIdentifier.position,
                scopes: SCOPE.KEYWORD,
            }

            colorParts.push(inKeywordIdentifier)
        }
    }

    return colorParts
}
