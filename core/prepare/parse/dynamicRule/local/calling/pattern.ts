import * as v from 'valibot'

import {
    Evaluable,
    Identifier,
    ListLiteral,
    Node,
    PatternUnit,
    PrepareErrorPlace,
    TooManyArgumentsError,
    TupleLiteral,
    u,
} from '@dalbit-yaksok/core'

import { FunctionHeaderPart, FunctionPartType } from '../type.ts'

const VALIDATION_ERROR_DUMMY_KEY = 'dummy-variable'

export function createCallingPattern(functionHeader: FunctionHeaderPart[]) {
    const pattern = functionHeader.map((g): PatternUnit => {
        if (g.type === FunctionPartType.parameter) {
            return Evaluable
        }

        return u(
            Identifier,
            v.object({
                value: v.picklist(g.names),
            }),
            v.metadata({
                isSuffix: g.isSuffix,
            }),
        )
    })

    function evaluatorFactory(nodes: Node[]): Record<string, Evaluable> | null {
        const nodesWithPart = functionHeader.flatMap((part, index) =>
            part.type === FunctionPartType.parameter
                ? [{ part, node: nodes[index] }]
                : [],
        )

        const entries = nodesWithPart.flatMap(({ part, node }) => {
            const isDestructure =
                part.params.length !== 1 &&
                (node instanceof TupleLiteral || node instanceof ListLiteral)

            if (isDestructure) {
                const hasArgumentOverflow =
                    part.params.length < node.subnode.length

                const destructured = node.subnode
                    .slice(0, part.params.length)
                    .map((tupleItem, index) => [
                        part.params[index].name,
                        tupleItem,
                    ])

                if (!hasArgumentOverflow) {
                    return destructured
                }

                const overflowError = new TooManyArgumentsError({
                    resource: {
                        expectedMax: part.params.length,
                        given: node.subnode.length,
                    },
                    tokens: node.tokens,
                })

                return destructured.concat([
                    [
                        VALIDATION_ERROR_DUMMY_KEY,
                        new PrepareErrorPlace([overflowError]),
                    ],
                ])
            } else {
                return [[part.params[0].name, node as Evaluable]]
            }
        })

        const evaluator = Object.fromEntries(entries)
        return evaluator
    }

    return {
        pattern,
        evaluatorFactory,
    }
}
