import { Evaluable, Expression, Identifier, type Node } from '../../../../node/base.ts'
import { FunctionInvoke } from '../../../../node/function.ts'
import { MemberFunctionInvoke } from '../../../../node/class.ts'

import { IndexFetch } from '../../../../node/list.ts'
import { NumberLiteral } from '../../../../node/primitive-literal.ts'
import type { IndexedValue } from '../../../../value/indexed.ts'
import { getCombination } from './combination.ts'

import type {
    FunctionTemplate,
    FunctionTemplatePiece,
} from '../../../../type/function-template.ts'
import type { Rule, PatternUnit } from '../../type.ts'
import { RULE_FLAGS } from '../../type.ts'

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

export function createMethodInvokeRule(
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
        createRuleFromMethodTemplate({
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
        flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
    }
}

function createRuleFromMethodTemplate(functionTemplate: FunctionTemplate): Rule {
    const pattern = createPatternFromMethodTemplatePieces(
        functionTemplate.pieces,
    )

    return {
        pattern,
        factory(matchedNodes, tokens) {
            const receiver = matchedNodes[0] as Evaluable
            const params = parseParameterFromTemplate(
                functionTemplate,
                matchedNodes.slice(2),
            )

            const functionInvoke = new FunctionInvoke(
                {
                    name: functionTemplate.name,
                    params,
                },
                tokens,
            )

            return new MemberFunctionInvoke(receiver, functionInvoke, tokens)
        },
        config: {
            exported: true,
        },
        flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
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

function createPatternFromMethodTemplatePieces(
    pieces: FunctionTemplatePiece[],
): PatternUnit[] {
    const methodPattern = pieces.map<PatternUnit>((piece) => {
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

    return [
        { type: Evaluable },
        { type: Expression, value: '.' },
        ...methodPattern,
    ]
}

export function parseParameterFromTemplate(
    template: FunctionTemplate,
    matchedNodes: Node[],
): Record<string, Evaluable> {
    let nodeIndex = 0
    const parameters: [string, Evaluable][] = []

    for (const piece of template.pieces) {
        if (piece.type === 'static') {
            nodeIndex++
            continue
        }

        const matchedNode = matchedNodes[nodeIndex] as Evaluable
        nodeIndex++

        if (piece.type === 'destructure') {
            for (let i = 0; i < piece.value.length; i++) {
                const paramName = piece.value[i]
                const indexFetch = new IndexFetch(
                    matchedNode as Evaluable<IndexedValue>,
                    new NumberLiteral(i, matchedNode.tokens),
                    matchedNode.tokens,
                )
                parameters.push([paramName, indexFetch])
            }
        } else {
            parameters.push([piece.value[0], matchedNode])
        }
    }

    return Object.fromEntries(parameters)
}
