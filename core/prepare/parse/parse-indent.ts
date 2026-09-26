import {
    Block,
    EOL,
    Indent,
    IndentLevelMismatchError,
    Node,
} from '@dalbit-yaksok/core'

interface LineRange {
    nodes: Node[]
    indent: number
}

export function parseIndent(nodes: Node[]): Node[] {
    const linebreakIndexes = [-1]
        .concat(
            nodes.flatMap((current, index) => {
                if (current instanceof EOL) {
                    return [index]
                }
                return []
            }),
        )
        .concat(nodes.length - 1)

    const lineRanges: LineRange[] = Array.from(
        {
            length: linebreakIndexes.length - 1,
        },
        (_, i) =>
            nodes.slice(linebreakIndexes[i] + 1, linebreakIndexes[i + 1] + 1),
    )
        .filter((lineNodes) =>
            lineNodes.slice(0, -1).some((n) => !(n instanceof Indent)),
        )
        .map((lineNodes): LineRange => {
            if (lineNodes[0] instanceof Indent) {
                return {
                    nodes: lineNodes.slice(1),
                    indent: lineNodes[0].size,
                }
            }

            return {
                nodes: lineNodes,
                indent: 0,
            }
        })

    return createIndentBlock(lineRanges).subnode
}

interface LevelGroup {
    type: 'current' | 'higher'
    ranges: LineRange[]
}

function createIndentBlock(lineRanges: LineRange[]): Block {
    const currentLevel = lineRanges[0].indent

    const levelGroups = lineRanges.slice(1).reduce(
        (groups: LevelGroup[], current) => {
            const lastGroup = groups[groups.length - 1]

            if (current.indent === currentLevel) {
                groups.push({
                    type: 'current',
                    ranges: [current],
                })

                return groups
            }

            if (lastGroup.type === 'higher') {
                lastGroup.ranges.push(current)

                return groups
            }

            groups.push({
                type: 'higher',
                ranges: [current],
            })

            return groups
        },
        [
            {
                type: 'current',
                ranges: [lineRanges[0]],
            },
        ],
    )

    let parsed = levelGroups.flatMap((levelGroup): Node[] => {
        if (levelGroup.type === 'higher') {
            const higherDepthBlock = createIndentBlock(levelGroup.ranges)

            if (currentLevel + 1 !== levelGroup.ranges[0].indent) {
                higherDepthBlock.injectParsingError(
                    new IndentLevelMismatchError({
                        resource: {
                            expected: currentLevel + 1,
                        },
                        tokens: higherDepthBlock.tokens,
                    }),
                )
            }

            return [higherDepthBlock, new EOL([])]
        }

        return levelGroup.ranges.flatMap((lineRange) => lineRange.nodes)
    })

    const tokens = parsed.flatMap((n) => n.tokens)
    return new Block(parsed, tokens)
}
