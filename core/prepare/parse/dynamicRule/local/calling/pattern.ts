import * as v from 'valibot'

import {
    Evaluable,
    Identifier,
    ListLiteral,
    Node,
    PatternUnit,
    TupleLiteral,
    u,
} from '@dalbit-yaksok/core'

import { FunctionHeaderPart, FunctionPartType } from '../type.ts'

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

        const evaluator = Object.fromEntries(
            nodesWithPart.flatMap(({ part, node }) =>
                node instanceof TupleLiteral || node instanceof ListLiteral
                    ? node.subnode.map((tupleItem, index) => [
                          part.params[index].name,
                          tupleItem,
                      ])
                    : [[part.params[0].name, node as Evaluable]],
            ),
        )

        return evaluator
    }

    return {
        pattern,
        evaluatorFactory,
    }
}
