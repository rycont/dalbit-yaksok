import {
    Evaluable,
    Expression,
    Identifier,
    type Node,
} from '../../../../node/base.ts'
import { Formula } from '../../../../node/calculation.ts'
import { FunctionInvoke } from '../../../../node/function.ts'
import { MemberFunctionInvoke } from '../../../../node/class.ts'
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

            // 어떤 인자든 괄호 없는 Formula가 들어오면 연산자 우선순위 모호성이다.
            // 예) `1 <= 배열 길이`  → 첫 인자가 Formula(1,<=,배열)
            //     `구매하기 '칫솔' '치약' == '성공'`  → 마지막 인자가 Formula('치약',==,'성공')
            for (const param of Object.values(params)) {
                if (param instanceof Formula) {
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

function createRuleFromMethodTemplate(
    functionTemplate: FunctionTemplate,
): Rule {
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

            const memberFuncInvoke = new MemberFunctionInvoke(
                receiver,
                functionInvoke,
                tokens,
            )

            // When the parser eagerly reduces `a op b` into Formula(a, op, b)
            // before seeing `.method`, the whole Formula becomes the receiver.
            // The actual receiver should be only the deepest last term.
            //
            // e.g. `i < 리스트.길이`
            //   → Formula(i, <, MFI(리스트, 길이))
            //
            // Compound: `i < a.길이 이고 j < b.길이`
            //   formula flattening produces: Formula(i,<,MFI(a,길이),이고, Formula(j,<,b))
            //   → Formula(i,<,MFI(a,길이),이고, Formula(j,<,MFI(b,길이)))
            return resolveFormulaReceiver(
                receiver,
                (r) => new MemberFunctionInvoke(r, functionInvoke, tokens),
                tokens,
            ) ?? memberFuncInvoke
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

/**
 * Recursively unwraps a Formula to find the true dot-method receiver.
 *
 * The SR parser eagerly reduces `a op b` to Formula before it can see `.method`,
 * so Formula(a, op, b) ends up as the receiver. This function walks into nested
 * Formulas (produced by formula-flattening of compound `이고`/`이거나` chains) and
 * replaces the deepest last-term with the MemberFunctionInvoke, rewrapping each
 * Formula layer on the way back up.
 *
 * Returns null if the receiver is not a Formula that needs correction.
 */
function resolveFormulaReceiver(
    receiver: Evaluable,
    createMFI: (trueReceiver: Evaluable) => MemberFunctionInvoke,
    tokens: Token[],
): Evaluable | null {
    if (!(receiver instanceof Formula)) {
        return null
    }

    const lastTerm = receiver.terms[receiver.terms.length - 1]
    if (
        !lastTerm ||
        typeof lastTerm !== 'object' ||
        !Array.isArray((lastTerm as { tokens?: unknown }).tokens)
    ) {
        return null
    }

    const inner = lastTerm as Evaluable

    // Recurse if the last term is itself a Formula (compound conditions like 이고/이거나)
    const fixedInner =
        resolveFormulaReceiver(inner, createMFI, tokens) ?? createMFI(inner)

    return new Formula([...receiver.terms.slice(0, -1), fixedInner], tokens)
}
