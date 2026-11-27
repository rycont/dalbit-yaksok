import {
    blue,
    bold,
    Expression,
    BrokenBracketError,
    Node,
    SRRule,
    Scope,
    Sequence,
    Evaluable,
    IncompleteEvaluable,
    EOL,
    Identifier,
    KeyValuePair,
    NumberLiteral,
    NotProperIdentifierNameToDefineError,
    YaksokError,
    UnexpectedTokenError,
    KeyValuePairSequence,
} from '@dalbit-yaksok/core'
import { callSRParseRecursively } from './srParse.ts'

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
        shape: '}',
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
        shape: ']',
        role: 'open',
    },
    ']': {
        shape: ']',
        role: 'close',
    },
}

export function parseBracket(
    scope: Scope,
    rawNodes: Node[],
    srRules: SRRule[],
) {
    const bracketRanges = createBracketMap(scope, rawNodes)

    if (bracketRanges.length === 0) {
        return rawNodes
    }

    const nodes = Array.from(rawNodes)

    for (const bracketRange of bracketRanges) {
        const start = nodes.indexOf(bracketRange.range[0]) + 1
        const end = nodes.indexOf(bracketRange.range[1])

        const nodesInBracket = nodes.slice(
            nodes[start] instanceof EOL ? start + 1 : start,
            nodes[end - 1] instanceof EOL ? end - 1 : end,
        )

        const parsed = parseByBracketType(
            bracketRange.type,
            callSRParseRecursively(scope, nodesInBracket, srRules),
        )

        nodes.splice(start, end - start, ...parsed)
    }

    return nodes
}

function parseByBracketType(type: string, nodes: Node[]) {
    if (type === '}') {
        return nodesToKeyValuePairs(nodes)
    }

    return nodesToSequence(nodes)
}

function nodesToKeyValuePairs(nodes: Node[]): Node[] {
    const delimiterIndexes = nodes.flatMap((node, i) =>
        (node instanceof Expression && node.value === ',') ||
        node instanceof EOL
            ? [i]
            : [],
    )

    if (delimiterIndexes.length === 0) {
        return nodes
    }

    const nodesByEntries = [nodes.slice(0, delimiterIndexes[0])]
        .concat(
            delimiterIndexes.map((commaIndex, i) =>
                nodes.slice(
                    commaIndex + 1,
                    delimiterIndexes[i + 1] ?? nodes.length,
                ),
            ),
        )
        .filter((l) => l.length)

    const entries = nodesByEntries.map((nodesInEntry) => {
        const [keyNode, delimiterNode, ...valueNodes] = nodesInEntry

        const [key, keyErrors] = getKeyFromNodes(keyNode)
        const delimiterErrors =
            delimiterNode instanceof Expression && delimiterNode.value === ':'
                ? []
                : [
                      new UnexpectedTokenError({
                          resource: {
                              parts: '사전의 키-값 구분자',
                          },
                          tokens: delimiterNode.tokens,
                      }),
                  ]

        const values =
            valueNodes.length === 1 && valueNodes[0] instanceof Evaluable
                ? valueNodes[0]
                : new IncompleteEvaluable(valueNodes)

        const entry = new KeyValuePair(
            key,
            values,
            nodes.flatMap((n) => n.tokens),
        )
        entry.parsingErrors = entry.parsingErrors
            .concat(keyErrors)
            .concat(delimiterErrors)

        return entry
    })

    return [
        new KeyValuePairSequence(
            entries,
            nodes.flatMap((n) => n.tokens),
        ),
    ]
}

function getKeyFromNodes(node: Node): [string | number, YaksokError[]] {
    if (node instanceof Identifier) {
        return [node.value, []]
    }

    if (node instanceof NumberLiteral) {
        return [node.toNumber(), []]
    }

    return [
        node.tokens.map((t) => t.value).join(''),
        [
            new NotProperIdentifierNameToDefineError({
                tokens: node.tokens,
                resource: {
                    context: '사전의 키',
                },
            }),
        ],
    ]
}

function nodesToSequence(nodes: Node[]): Node[] {
    const commaIndexes = nodes.flatMap((node, i) =>
        node instanceof Expression && node.value === ',' ? [i] : [],
    )

    if (commaIndexes.length === 0) {
        return nodes
    }

    const elements = [nodes.slice(0, commaIndexes[0])].concat(
        commaIndexes.map((commaIndex, i) =>
            nodes.slice(commaIndex + 1, commaIndexes[i + 1] ?? nodes.length),
        ),
    )

    const evaluables = elements.map((e) => {
        if (e.length === 1 && e[0] instanceof Evaluable) {
            return e[0]
        }

        return new IncompleteEvaluable(e)
    })

    return [
        new Sequence(
            evaluables,
            nodes.flatMap((n) => n.tokens),
        ),
    ]
}

function createBracketMap(scope: Scope, nodes: Node[]) {
    const seekingStack: { char: string; node: Expression }[] = []
    const bracketRanges: { type: string; range: [Node, Node] }[] = []

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
                bracketRanges.push({
                    range: [last.node, current],
                    type: currentBracket.shape,
                })
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
                scope,
                node: item.node,
                resource: {
                    message: `닫는 괄호가 필요해요. 내용이 끝나면 ${bold(blue(BRACKETS[item.char].shape))}로 닫아주세요.`,
                },
            }),
        )
    }

    return bracketRanges
}
