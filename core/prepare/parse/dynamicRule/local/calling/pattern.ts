import * as v from 'valibot'

import {
    Evaluable,
    Identifier,
    InvokingArguments,
    ListLiteral,
    Node,
    ParameterElement,
    PatternUnit,
    TooManyArgumentsError,
    TupleLiteral,
    u,
    YaksokError,
} from '@dalbit-yaksok/core'

import { FunctionHeaderPart, FunctionPartType } from '../type.ts'

export function createCallingPattern(
    functionHeader: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
) {
    const pattern = functionHeader.map((g): PatternUnit => {
        if (g.type === FunctionPartType.parameter) {
            return Evaluable
        }

        return u(
            Identifier,
            v.object({
                value: v.picklist(g.names.map((n) => n.value)),
            }),
            v.metadata({
                isSuffix: g.isSuffix,
            }),
        )
    })

    function invokingArgumentsFactory(nodes: Node[]) {
        const nodesWithPart = functionHeader.flatMap((part, index) =>
            part.type === FunctionPartType.parameter
                ? [{ part, node: nodes[index] }]
                : [],
        )

        const entries = nodesWithPart.flatMap(
            ({ part, node }): ([string, Evaluable] | YaksokError)[] => {
                const isDestructure =
                    part.params.length !== 1 &&
                    (node instanceof TupleLiteral ||
                        node instanceof ListLiteral)

                if (isDestructure) {
                    const hasArgumentOverflow =
                        part.params.length < node.subnode.length

                    const destructured = node.subnode
                        .slice(0, part.params.length)
                        .map<[string, Evaluable] | YaksokError>(
                            (tupleItem, index) => [
                                part.params[index].name,
                                tupleItem,
                            ],
                        )

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

                    return destructured.concat([overflowError])
                } else {
                    return [[part.params[0].name, node as Evaluable] as const]
                }
            },
        )

        const group = Object.groupBy(entries, (entry) =>
            entry instanceof YaksokError ? 'error' : 'value',
        ) as {
            error?: YaksokError[]
            value?: [string, Evaluable][]
        }

        return new InvokingArguments(
            new Map(group.value),
            parameterScheme,
            nodes.flatMap((n) => n.tokens),
            group.error || [],
        )
    }

    return {
        pattern,
        invokingArgumentsFactory,
    }
}
