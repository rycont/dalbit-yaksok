import {
    Block,
    EOL,
    Identifier,
    KeyValuePair,
    KeyValuePairSequence,
    Node,
    PatternUnitChain,
    r,
    Rule,
    Token,
} from '@dalbit-yaksok/core'
import { FunctionSignature, FunctionStaticPart } from '../type.ts'
import { j } from '@dalbit-yaksok/pattern'
import { InvokingArguments } from '../node/arguments.ts'
import { FunctionInvoke } from '../node/invoke.ts'
import { FunctionDeclareHeader } from '../node/header.ts'

export function createBlockRule(
    signature: FunctionSignature,
    header: FunctionDeclareHeader,
): Rule {
    const staticParts = signature.headerParts.slice(
        0,
        -1,
    ) as FunctionStaticPart[]

    const signaturePattern = staticParts
        .map<PatternUnitChain<Node>>((part) =>
            j.instance(Identifier).field({
                value: j.enum(part.names.map((n) => n.value)),
            }),
        )
        .concat([j.instance(EOL), j.instance(Block)])

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

        return new InvokingArguments(
            entries,
            signature.parameterScheme,
            block.tokens,
            [],
        )
    }

    function factory(nodes: Node[], tokens: Token[]) {
        const parameterNode = nodes[nodes.length - 1]
        const invokingArguments = createInvokingArguments(parameterNode)

        if (invokingArguments === null) {
            return null
        }

        return new FunctionInvoke(
            signature.functionName,
            header,
            invokingArguments,
            tokens,
        )
    }

    return r({
        pattern: signaturePattern,
        factory,
    })
}
