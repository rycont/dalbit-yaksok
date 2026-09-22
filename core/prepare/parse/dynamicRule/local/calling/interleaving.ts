import * as v from 'valibot'
import {
    Evaluable,
    Identifier,
    Node,
    FunctionInvoke,
    u,
    Rule,
    TupleLiteral,
    ParameterElement,
} from '@dalbit-yaksok/core'

import { FunctionHeaderPart, FunctionPartType } from '../type.ts'

export function createInterleavingRule(
    functionName: string,
    functionHeader: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
): Rule {
    const pattern = functionHeader.map((g) => {
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

    function createEvaluator(nodes: Node[]): Record<string, Evaluable> | null {
        const nodesWithPart = functionHeader.flatMap((part, index) =>
            part.type === FunctionPartType.parameter
                ? [{ part, node: nodes[index] }]
                : [],
        )

        const isAllTuple = nodesWithPart.every(
            ({ node }) => node instanceof TupleLiteral,
        )

        if (!isAllTuple) {
            return null
        }

        const evaluator = Object.fromEntries(
            nodesWithPart.flatMap(({ part, node }) =>
                (node as TupleLiteral).subnode.map((tupleItem, index) => [
                    part.params[index].name,
                    tupleItem,
                ]),
            ),
        )

        return evaluator
    }

    return {
        pattern,
        factory(nodes, tokens) {
            const argumentEvaluator = createEvaluator(nodes)

            if (argumentEvaluator === null) {
                return null
            }

            return new FunctionInvoke(
                {
                    name: functionName,
                    argumentEvaluator,
                    parameterScheme,
                },
                tokens,
            )
        },
    }
}
