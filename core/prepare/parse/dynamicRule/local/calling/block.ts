import * as v from 'valibot'

import {
    Block,
    EOL,
    FunctionInvoke,
    Identifier,
    KeyValuePair,
    KeyValuePairSequence,
    Node,
    ParameterElement,
    PatternUnit,
    Rule,
    Token,
    u,
} from '@dalbit-yaksok/core'
import { FunctionHeaderPart, FunctionStaticPart } from '../type.ts'

export function createBlockRule(
    functionName: string,
    functionHeader: FunctionHeaderPart[],
    parameterScheme: ParameterElement[],
): Rule {
    const staticParts = functionHeader.slice(0, -1) as FunctionStaticPart[]

    const signaturePattern = staticParts
        .map<PatternUnit>((part) =>
            u(
                Identifier,
                v.object({
                    value: v.picklist(part.names),
                }),
            ),
        )
        .concat([EOL, Block])

    function createArgument(block: Node) {
        if (!(block instanceof Block)) {
            return null
        }

        if (block.subnode.length !== 1) {
            return null
        }

        const [subnode] = block.subnode

        const providedArguments =
            subnode instanceof KeyValuePairSequence
                ? Object.fromEntries(
                      subnode.subnode.map((kvPair) => [
                          kvPair.key,
                          kvPair.subnode,
                      ]),
                  )
                : subnode instanceof KeyValuePair
                  ? { [subnode.key]: subnode.subnode }
                  : null

        if (providedArguments === null) {
            return null
        }

        return providedArguments
    }

    function factory(nodes: Node[], tokens: Token[]) {
        const parameterNode = nodes[nodes.length - 1]
        const argumentEvaluator = createArgument(parameterNode)

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
    }

    return {
        pattern: signaturePattern,
        factory,
    }
}
