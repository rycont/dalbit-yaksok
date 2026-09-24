import * as v from 'valibot'

import {
    Block,
    EOL,
    FunctionInvoke,
    Identifier,
    InvokingArguments,
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

    function createInvokingArguments(block: Node): InvokingArguments | null {
        if (!(block instanceof Block)) {
            return null
        }

        if (block.subnode.length !== 1) {
            return null
        }

        const [subnode] = block.subnode

        const entries =
            subnode instanceof KeyValuePairSequence
                ? new Map(
                      subnode.subnode.map((kvPair) => [
                          kvPair.key.toString(),
                          kvPair.subnode,
                      ]),
                  )
                : subnode instanceof KeyValuePair
                  ? new Map([[subnode.key.toString(), subnode.subnode]])
                  : null

        if (entries === null) {
            return null
        }

        return new InvokingArguments(entries, parameterScheme, block.tokens, [])
    }

    function factory(nodes: Node[], tokens: Token[]) {
        const parameterNode = nodes[nodes.length - 1]
        const invokingArguments = createInvokingArguments(parameterNode)

        if (invokingArguments === null) {
            return null
        }

        return new FunctionInvoke(functionName, invokingArguments, tokens)
    }

    return {
        pattern: signaturePattern,
        factory,
    }
}
