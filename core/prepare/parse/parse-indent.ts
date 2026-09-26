import { Block, EOL, Indent, Node } from '@dalbit-yaksok/core'

interface LineRange {
    nodes: Node[]
    indent: number
}

export function parseIndent(nodes: Node[]): Node[] {
    const linebreakIndexes = nodes.flatMap((current, index) => {
        if (current instanceof EOL) {
            return [index]
        }
        return []
    })

    const lineRanges: LineRange[] = Array.from(
        {
            length: linebreakIndexes.length - 1,
        },
        (_, i) => nodes.slice(linebreakIndexes[i] + 1, linebreakIndexes[i + 1]),
    )
        .filter((lineNodes) => lineNodes.some((n) => !(n instanceof Indent)))
        .map((lineNodes): LineRange => {
            if (lineNodes[0] instanceof Indent) {
                return {
                    nodes: lineNodes,
                    indent: lineNodes[0].size,
                }
            }

            return {
                nodes: lineNodes,
                indent: 0,
            }
        })

    createIndentBlock(lineRanges)

    return nodes
}

function createIndentBlock(lineRanges: LineRange[]): Block {
    const level = lineRanges[0].indent

    const currentLevelIndexes = lineRanges.flatMap((r, i) =>
        r.indent === level ? [i] : [],
    )

    const parsed = currentLevelIndexes.flatMap((levelIndex, i) => {
        const prevIndex = currentLevelIndexes[i - 1]

        const higherDepthRanges = lineRanges.slice(prevIndex, levelIndex)

        if (higherDepthRanges.length === 0) {
            return lineRanges[levelIndex].nodes
        }

        const higherDepthBlock = createIndentBlock(higherDepthRanges)
    })

    return new Block(parsed)
}
