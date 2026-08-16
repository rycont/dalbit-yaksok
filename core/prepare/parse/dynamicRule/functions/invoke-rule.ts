import {
    Evaluable,
    Expression,
    Identifier,
    type Node,
} from '../../../../node/base.ts'
import { Formula } from '../../../../node/calculation.ts'
import { RangeOperator } from '../../../../node/operator.ts'
import { FunctionInvoke } from '../../../../node/function.ts'
import { FunctionCallOperatorAmbiguityError } from '../../../../error/prepare.ts'

import { IndexFetch } from '../../../../node/list.ts'
import { NumberLiteral } from '../../../../node/primitive-literal.ts'
import type { IndexedValue } from '../../../../value/indexed.ts'
import { getCombination } from './combination.ts'

import type {
    FunctionTemplate,
    FunctionTemplatePiece,
} from '../../../../type/function-template.ts'
import type { PatternUnit, Rule } from '../../type.ts'
import { RULE_FLAGS } from '../../type.ts'
import type { Token } from '../../../tokenize/token.ts'

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

            // 어떤 인자든 괄호 없는 Formula가 들어오면 연산자 우선순위 모호성이다.
            // 예) `1 <= 배열 길이`  → 첫 인자가 Formula(1,<=,배열)
            //     `구매하기 '칫솔' '치약' == '성공'`  → 마지막 인자가 Formula('치약',==,'성공')
            //
            // 예외: `Evaluable ~ Evaluable` 형태의 범위 Formula는 허용한다.
            // 예) `1~100 사이 무작위 값 가져오기` → 인자가 RangeFormula(1,~,100)
            //     범위의 경계가 명확하므로 모호성이 없다.
            for (const param of Object.values(params)) {
                if (param instanceof Formula && !isRangeFormula(param)) {
                    throw new FunctionCallOperatorAmbiguityError({ tokens })
                }
            }

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


/**
 * `Evaluable ~ Evaluable` 형태의 범위 Formula인지 확인한다.
 * 이 경우는 모호성이 없으므로 FunctionCallOperatorAmbiguityError를 던지지 않는다.
 * 예) `1~100 사이 무작위 값 가져오기` → isRangeFormula(Formula(1, ~, 100)) === true
 */
function isRangeFormula(formula: Formula): boolean {
    const { terms } = formula
    return (
        terms.length === 3 &&
        terms[0] instanceof Evaluable &&
        terms[1] instanceof RangeOperator &&
        terms[2] instanceof Evaluable
    )
}
