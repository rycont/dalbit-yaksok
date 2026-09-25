import { BrokenBracketError, Node, Rule } from '@dalbit-yaksok/core'
import { Expression } from '../../node/index.ts'
import { callParseRecursively } from './srParse.ts'
import { blue, bold } from '../../util/terminal.ts'

const BRACKETS: Record<
    string,
    {
        shape: string
        role: 'open' | 'close'
    }
> = {
    '{': {
        shape: '}',
        role: 'open',
    },
    '}': {
        shape: '{}',
        role: 'close',
    },
    '(': {
        shape: ')',
        role: 'open',
    },
    ')': {
        shape: ')',
        role: 'close',
    },
    '[': {
        shape: ')',
        role: 'open',
    },
    ']': {
        shape: ')',
        role: 'close',
    },
}

export function parseBracket(rawNodes: Node[], externalPatterns: Rule[]) {
    const brackets = createBracketMap(rawNodes)

    if (brackets.length === 0) {
        return rawNodes
    }

    const nodes = Array.from(rawNodes)

    for (const range of brackets) {
        const start = nodes.indexOf(range[0]) + 1
        const end = nodes.indexOf(range[1])

        const nodesInBracket = nodes.slice(start, end)
        const parsed = callParseRecursively(nodesInBracket, externalPatterns)

        nodes.splice(start, end - start, ...parsed)
    }

    return nodes
}

function createBracketMap(nodes: Node[]) {
    const seekingStack: { char: string; node: Expression }[] = []
    const bracketRanges: [Node, Node][] = []

    for (let i = 0; i < nodes.length; i++) {
        const current = nodes[i]

        if (!(current instanceof Expression)) {
            continue
        }

        if (!(current.value in BRACKETS)) {
            continue
        }

        if (seekingStack.length === 0) {
            seekingStack.push({
                char: current.value,
                node: current,
            })
            continue
        }

        const currentBracket = BRACKETS[current.value as keyof typeof BRACKETS]

        if (currentBracket.role === 'close') {
            const last = seekingStack.pop()!
            const lastBracket = BRACKETS[last.char]

            if (lastBracket.shape === currentBracket.shape) {
                bracketRanges.push([last.node, current])
            }

            continue
        }

        seekingStack.push({
            char: current.value,
            node: current,
        })
    }

    for (const item of seekingStack) {
        item.node.injectParsingError(
            new BrokenBracketError({
                resource: {
                    message: `닫는 괄호가 필요해요. 내용이 끝나면 ${bold(blue(BRACKETS[item.char].shape))}로 닫아주세요.`,
                },
            }),
        )
    }

    return bracketRanges
}
