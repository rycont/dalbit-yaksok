import {
    Evaluable,
    Expression,
    Identifier,
    type Node,
} from '../../../../node/base.ts'
import { Formula, ValueWithParenthesis } from '../../../../node/calculation.ts'
import { RangeOperator } from '../../../../node/operator.ts'
import { FunctionInvoke } from '../../../../node/function.ts'
import { FunctionCallOperatorAmbiguityError } from '../../../../error/prepare.ts'

import { IndexFetch } from '../../../../node/list.ts'
import {
    EmptyLiteral,
    NumberLiteral,
} from '../../../../node/primitive-literal.ts'
import type { IndexedValue } from '../../../../value/indexed.ts'
import { getCombination } from './combination.ts'

import type {
    DestructurePiece,
    FunctionTemplate,
    FunctionTemplatePiece,
    ParameterPiece,
    StaticPiece,
} from '../../../../type/function-template.ts'
import {
    PIECE_TYPE,
    SIGNATURE_TYPE,
} from '../../../../type/function-template.ts'
import type { PatternUnit, Rule } from '../../type.ts'
import { RULE_FLAGS } from '../../type.ts'
import { Block, TupleLiteral } from '../../../../node/index.ts'
import { EOL } from '../../../../node/misc.ts'
import { KeyValuePair, KeyValuePairSequence } from '../../../../node/dict.ts'
import { TupleValue } from '@dalbit-yaksok/core'
import type { ParameterElement } from '../../../../constant/type.ts'
import { TooManyArgumentsError } from '../../../../error/function.ts'

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

    const rules = templatePieces.flatMap((pieces) =>
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

        const isStatic = templatePiece.type === PIECE_TYPE.STATIC
        if (!isStatic) {
            continue
        }

        const hasSlash = templatePiece.variations.length

        if (hasSlash) {
            yield {
                index: +templatePieceIndex,
                candidates: templatePiece.variations,
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
            type: PIECE_TYPE.STATIC,
            variations: [content],
        }
    }

    return parts
}

function createRuleFromFunctionTemplate(
    functionTemplate: FunctionTemplate,
): Rule[] {
    const pattern = createInlineInvokerPattern(functionTemplate.pieces)
    const signatureType = getSignatureType(functionTemplate.pieces)

    const interleavingInvoker: Rule = {
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
                    argumentEvaluator: params,
                    parameterScheme: functionTemplate.parameterScheme,
                },
                tokens,
            )
        },
        config: {
            exported: true,
        },
        flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
    }

    if (signatureType === SIGNATURE_TYPE.BRACKET_CALL) {
        const parameterBlockRule = createParameterBlockRule(functionTemplate)
        const inlineBracketRule = createInlineBracketRule(functionTemplate)

        return [parameterBlockRule, inlineBracketRule, interleavingInvoker]
    }

    return [interleavingInvoker]
}

function createInlineBracketRule(functionTemplate: FunctionTemplate) {
    const pattern = createInlineBracketPattern(functionTemplate.pieces)

    const parseArgumentTuple = createArgumentTupleParser(
        functionTemplate.parameterScheme,
    )

    const rule: Rule = {
        pattern,
        factory(matchedNodes, tokens) {
            const argumentTuple = matchedNodes[matchedNodes.length - 1]
            const params = parseArgumentTuple(argumentTuple)

            if (!params) {
                return null
            }

            return new FunctionInvoke(
                {
                    name: functionTemplate.name,
                    argumentEvaluator: params,
                    parameterScheme: functionTemplate.parameterScheme,
                },
                tokens,
            )
        },
        config: {
            exported: true,
        },
        flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
    }

    return rule
}

function createArgumentTupleParser(parameterElements: ParameterElement[]) {
    return function parseArgument(node: Node) {
        if (node instanceof TupleLiteral) {
            if (parameterElements.length < node.items.length) {
                throw new TooManyArgumentsError({
                    resource: {
                        expectedMax: parameterElements.length,
                        given: node.items.length,
                    },
                    tokens: node.tokens,
                })
            }

            const parsedArgument = Object.fromEntries(
                node.items.map((elementNode, index) => [
                    parameterElements[index].name,
                    elementNode,
                ]),
            )

            return parsedArgument
        }

        if (node instanceof ValueWithParenthesis) {
            return {
                [parameterElements[0].name]: node.value,
            }
        }

        return null
    }
}

function createInlineBracketPattern(
    pieces: FunctionTemplatePiece[],
): PatternUnit[] {
    const pattern = pieces
        .filter((p) => p.type === PIECE_TYPE.STATIC)
        .map(
            (p) =>
                ({
                    type: Identifier,
                    value: p.variations[0],
                }) as PatternUnit,
        )
        .concat([
            {
                type: Evaluable,
            },
        ])

    return pattern
}

function createParameterBlockRule(functionTemplate: FunctionTemplate) {
    const pattern = createBlockParameterInvokerPattern(functionTemplate.pieces)

    const rule: Rule = {
        pattern,
        factory(matchedNodes, tokens) {
            const params = extractParamsFromBlock(
                matchedNodes[matchedNodes.length - 1],
            )

            return new FunctionInvoke(
                {
                    name: functionTemplate.name,
                    argumentEvaluator: params,
                    parameterScheme: functionTemplate.parameterScheme,
                },
                tokens,
            )
        },
        config: {
            exported: true,
        },
        flags: [RULE_FLAGS.IS_FUNCTION_INVOKE],
    }

    return rule
}

function extractParamsFromBlock(node: Node): Record<string, Evaluable> {
    if (!(node instanceof Block)) {
        return {}
    }

    const kvSequence = node.children[0]

    if (!(kvSequence instanceof KeyValuePairSequence)) {
        if (kvSequence instanceof KeyValuePair) {
            return { [kvSequence.key]: kvSequence.entry }
        }

        return {}
    }

    const pairs = Object.fromEntries(
        kvSequence.pairs.map((p) => [p.key, p.entry]),
    )
    return pairs
}

function createInlineInvokerPattern(
    pieces: FunctionTemplatePiece[],
): PatternUnit[] {
    return pieces.map((piece) => {
        if (piece.type === PIECE_TYPE.STATIC) {
            return {
                type: Identifier,
                value: piece.variations[0],
            }
        }

        return {
            type: Evaluable,
        }
    })
}

function createBlockParameterInvokerPattern(
    allPieces: FunctionTemplatePiece[],
): PatternUnit[] {
    const signatureHeaders = allPieces.slice(0, -1)

    if (!signatureHeaders.every((s) => s.type === PIECE_TYPE.STATIC)) {
        console.error(
            '함수 시그니처에 non-static 요소가 포함되어 있어 규칙을 생성할 수 없습니다.',
            signatureHeaders,
        )

        return []
    }

    const functionHeader: PatternUnit[] = signatureHeaders.map((p) => ({
        type: Identifier,
        value: p.variations[0],
    }))

    const invokerPattern = functionHeader.concat([
        {
            type: EOL,
        },
        {
            type: Block,
        },
    ])

    return invokerPattern
}

function getSignatureType(pieces: FunctionTemplatePiece[]) {
    const hasInterleaving = pieces
        .slice(0, -1)
        .some((p) => p.type !== PIECE_TYPE.STATIC)

    if (hasInterleaving) {
        return SIGNATURE_TYPE.INTERLEAVING
    }

    const lastPiece = pieces[pieces.length - 1]

    if (lastPiece.type === PIECE_TYPE.STATIC) {
        return SIGNATURE_TYPE.NO_PARAMETER
    }

    return SIGNATURE_TYPE.BRACKET_CALL
}

export function parseParameterFromTemplate(
    template: FunctionTemplate,
    matchedNodes: Node[],
): Record<string, Evaluable> {
    const indexBlocks = template.pieces.map(
        (piece, index) => [index, piece] as const,
    )

    const interleavingParameterIndexes = indexBlocks
        .filter(
            (indexBlock): indexBlock is [number, ParameterPiece] =>
                indexBlock[1].type === PIECE_TYPE.PARAMETER,
        )
        .map(([index, piece]) => [index, piece.name] as const)

    const interleavingParameters = interleavingParameterIndexes.map(
        ([index, name]) => [name, matchedNodes[index] as Evaluable] as const,
    )

    const destructureParameterIndexes = indexBlocks
        .filter(
            (indexBlock): indexBlock is [number, DestructurePiece] =>
                indexBlock[1].type === PIECE_TYPE.DESTRUCTURE,
        )
        .map(
            ([index, piece]) =>
                [index, piece.parameterElements.map((e) => e.name)] as const,
        )

    const destructureParameters = destructureParameterIndexes.flatMap(
        ([tupleIndex, subParameters]) =>
            subParameters.map<[string, Evaluable]>((subName, i) => {
                const subfetcher = new IndexFetch(
                    matchedNodes[tupleIndex] as Evaluable<IndexedValue>,
                    new NumberLiteral(i, matchedNodes[tupleIndex].tokens),
                    matchedNodes[tupleIndex].tokens,
                )

                return [subName, subfetcher] as const
            }),
    )

    const entries = Object.fromEntries([
        ...interleavingParameters,
        ...destructureParameters,
    ])

    return entries
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
