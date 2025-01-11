import { Evaluable, Identifier, type Node } from '../../../../node/base.ts'
import { FunctionInvoke } from '../../../../node/function.ts'
import { getCombination } from './combination.ts'

import type {
    FunctionTemplate,
    FunctionTemplatePiece,
} from '../../../../type/function-template.ts'
import type { PatternUnit } from '../../rule.ts'
import type { Rule } from '../../rule.ts'

interface VariantedPart {
    index: number
    candidates: string[]
}

export function createFunctionInvokeRule(
    functionTemplate: FunctionTemplate,
): Rule[] {
    const variantParts = [...getVariantParts(functionTemplate.pieces)]
    const availableCombinations = getCombination(
        variantParts.map((v) => v.candidates.map((_, i) => i)),
    )

    const templatePieces = availableCombinations.map((choice) =>
        createTemplatePieceFromChoices(
            functionTemplate.pieces,
            variantParts,
            choice,
        ),
    )

    const rules = templatePieces.map((pieces) =>
        createRuleFromFunctionTemplate({
            ...functionTemplate,
            pieces,
        }),
    )

    return rules
}

function* getVariantParts(
    templatePieces: FunctionTemplatePiece[],
): Iterable<VariantedPart> {
    for (const templatePieceIndex in templatePieces) {
        const templatePiece = templatePieces[templatePieceIndex]

        const isStatic = templatePiece.type === 'static'
        const hasSlash = templatePiece.value.length

        if (isStatic && hasSlash) {
            yield {
                index: +templatePieceIndex,
                candidates: templatePiece.value,
            }
        }
    }
}

function createTemplatePieceFromChoices(
    templatePieces: FunctionTemplatePiece[],
    variantParts: VariantedPart[],
    choice: number[],
): FunctionTemplatePiece[] {
    const parts = [...templatePieces]

    for (const [index, optionIndex] of choice.entries()) {
        const { candidates } = variantParts[index]
        const content = candidates[optionIndex]

        parts[variantParts[index].index] = {
            type: 'static',
            value: [content],
        }
    }

    return parts
}

function createRuleFromFunctionTemplate(
    functionTemplate: FunctionTemplate,
): Rule {
    const pattern = createPatternFromTemplatePieces(functionTemplate.pieces)

    return {
        pattern,
        factory(matchedNodes, tokens) {
            const params = parseParameterFromTemplate(
                functionTemplate,
                matchedNodes,
            )

            return new FunctionInvoke(
                {
                    name: functionTemplate.name,
                    params,
                },
                tokens,
            )
        },
        config: {
            exported: true,
        },
    }
}

function createPatternFromTemplatePieces(
    pieces: FunctionTemplatePiece[],
): PatternUnit[] {
    return pieces.map((piece) => {
        if (piece.type === 'static') {
            return {
                type: Identifier,
                value: piece.value[0],
            }
        }

        return {
            type: Evaluable,
        }
    })
}

function parseParameterFromTemplate(
    template: FunctionTemplate,
    matchedNodes: Node[],
): Record<string, Evaluable> {
    const parameters = template.pieces
        .map((piece, index) => {
            if (piece.type === 'static') {
                return null
            }

            const paramName = piece.value[0]
            const matchedNode = matchedNodes[index]

            return [paramName, matchedNode]
        })
        .filter(Boolean) as [string, Identifier][]

    return Object.fromEntries(parameters)
}
