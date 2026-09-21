import * as v from 'valibot'

import {
    Evaluable,
    FunctionInvoke,
    Identifier,
    Node,
    Rule,
    TupleLiteral,
} from '@dalbit-yaksok/core'

import { FunctionPartType, NameGroup } from './type.ts'
import { u } from '../../type.ts'

export function createCallingRules(
    functionName: string,
    nameGroups: NameGroup[],
): Rule {
    const pattern = nameGroups.map((g) => {
        if (g.type === FunctionPartType.parameter) {
            return Evaluable
        }

        return u(
            Identifier,
            v.object({
                value: v.picklist(g.names),
            }),
        )
    })

    function createEvaluator(nodes: Node[]): Record<string, Evaluable> {
        return Object.fromEntries(
            nameGroups.flatMap((g, partIndex) =>
                g.type === FunctionPartType.parameter
                    ? g.names.map((parameterName, destructureIndex) => {
                          const matchedNode = nodes[partIndex]
                          if (matchedNode instanceof TupleLiteral) {
                              const parameterNode =
                                  matchedNode.subnode[destructureIndex]

                              if (!(parameterNode instanceof Evaluable)) {
                                  return []
                              }

                              return [parameterName, parameterNode]
                          } else {
                              if (!(matchedNode instanceof Evaluable)) {
                                  return []
                              }

                              return [parameterName, matchedNode]
                          }
                      })
                    : [],
            ),
        )
    }

    return {
        pattern,
        factory(nodes, tokens) {
            const argumentEvaluator = createEvaluator(nodes)
            return new FunctionInvoke(
                {
                    name: functionName,
                    argumentEvaluator,
                    parameterScheme: [],
                },
                tokens,
            )
        },
    }
}
