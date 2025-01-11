import type { Node, Token } from '../mod.ts'

export function getTokensFromNodes(nodes: Node[]): Token[] {
    return nodes.flatMap((node) => node.tokens)
}
