import {
    Evaluable,
    Identifier,
    ListLiteral,
    Node,
    PatternUnitChain,
    TupleLiteral,
    YaksokError,
} from '@dalbit-yaksok/core'
import { FunctionPartType, FunctionSignature } from '../type.ts'
import { j } from '@dalbit-yaksok/pattern'
import { TooManyArgumentsError } from '../error/too-many-arguments.ts'
import { InvokingArguments } from '../node/arguments.ts'

export function createCallingPattern(signature: FunctionSignature) {
    const pattern = signature.headerParts.map((g): PatternUnitChain<Node> => {
        if (g.type === FunctionPartType.parameter) {
            return j.instance(Evaluable)
        }

        return j
            .instance(Identifier)
            .field({
                value: j.enum(g.names.map((n) => n.value)),
            })
            .meta({
                isSuffix: g.isSuffix,
                nameOptions: g.names.map((n) => n.value),
            })
    })

    function invokingArgumentsFactory(nodes: Node[]) {
        const nodesWithPart = signature.headerParts.flatMap((part, index) =>
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
                    const entry: [string, Evaluable] = [
                        part.params[0].name,
                        node as Evaluable,
                    ]

                    return [entry]
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
            signature.parameterScheme,
            nodes.flatMap((n) => n.tokens),
            group.error || [],
        )
    }

    return {
        pattern,
        invokingArgumentsFactory,
    }
}
