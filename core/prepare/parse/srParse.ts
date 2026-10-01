import {
    AmbiguousFormulaBoundary,
    Block,
    EOL,
    Formula,
    Identifier,
    Node,
    Rule,
} from '@dalbit-yaksok/core'

import { RESERVED_WORDS } from '../../constant/reserved-words.ts'
import { getTokensFromNodes } from '../../util/merge-tokens.ts'
import { BASIC_RULES, ADVANCED_RULES } from './rule/index.ts'
import { Ruleset } from './ruleset.ts'
import { NotAcceptableSignal } from './signal.ts'

export function SRParse(_nodes: Node[], ruleset: Ruleset) {
    const leftNodes = [..._nodes]
    const buffer: Node[] = []

    let changed = false

    nodeloop: while (true) {
        const matchedRules = ruleset.findRule(buffer)

        for (const rule of matchedRules) {
            const isStatement = !!rule.isStatement

            if (isStatement) {
                const nextNode = leftNodes[0]
                if (nextNode && !(nextNode instanceof EOL)) continue

                const lastNode = buffer[buffer.length - rule.pattern.length - 1]
                if (lastNode && !(lastNode instanceof EOL)) continue
            }

            const stackSlice = buffer.slice(-rule.pattern.length)
            const reduced = reduce(stackSlice, rule)

            if (reduced === null) continue

            if (
                stackSlice.length === 1 &&
                reduced.constructor === stackSlice[0].constructor
            ) {
                continue
            }

            if (reduced instanceof Formula) {
                const prev2Nodes = buffer.slice(
                    -rule.pattern.length - 2,
                    -rule.pattern.length,
                )

                const next2Nodes = leftNodes.slice(0, 2)

                const collisionNodes = hasFunctionInvokeCollision(
                    reduced,
                    prev2Nodes,
                    next2Nodes,
                )

                if (collisionNodes) {
                    reduced.injectParsingError(
                        new AmbiguousFormulaBoundary({
                            tokens: collisionNodes.flatMap((n) => n.tokens),
                        }),
                    )
                }
            }

            buffer.splice(-rule.pattern.length, rule.pattern.length, reduced)

            changed = true
            continue nodeloop
        }

        if (leftNodes.length === 0) break
        buffer.push(leftNodes.shift()!)
    }

    return {
        changed,
        nodes: buffer,
    }
}

export function reduce(nodes: Node[], rule: Rule) {
    const tokens = getTokensFromNodes(nodes)

    try {
        const reduced = rule.factory(nodes, tokens, rule)
        if (reduced === null) {
            return null
        }

        return reduced
    } catch (e) {
        if (e instanceof NotAcceptableSignal) {
            return null
        }

        throw e
    }
}

export function callParseRecursively(
    nodes: Node[],
    externalPatterns: Rule[],
): Node[] {
    let parsedNodes = [...nodes]

    for (let i = 0; i < parsedNodes.length; i++) {
        const token = parsedNodes[i]

        if (token instanceof Block) {
            token.subnode = callParseRecursively(
                token.subnode,
                externalPatterns,
            )
        }
    }

    const rulesByLevel = [...BASIC_RULES, externalPatterns, ADVANCED_RULES]
    const rulesets = rulesByLevel.map((rules) => Ruleset.createFromRules(rules))

    loop1: while (true) {
        for (const ruleset of rulesets) {
            const result = SRParse(parsedNodes, ruleset)
            parsedNodes = result.nodes

            if (result.changed) continue loop1
        }

        break
    }

    return parsedNodes
}

function hasFunctionInvokeCollision(
    formula: Formula,
    prev2Nodes: Node[],
    next2Nodes: Node[],
) {
    if (isSequentialIdentifier(prev2Nodes)) {
        return prev2Nodes
    }

    const lastPrev = prev2Nodes[prev2Nodes.length - 1]

    if (isSequentialIdentifier(next2Nodes)) {
        // 반복 [목록] 의 [반복자] << 이 경우에서 `이 [반복자]` 패턴에서 (Identifier Identifier)로 인식되는 문제 방지

        if (
            lastPrev &&
            lastPrev instanceof Identifier &&
            lastPrev.value === '반복'
        ) {
            return false
        }

        return next2Nodes
    }

    const leftAndPrev = [lastPrev, formula.subnode[0]]

    if (isSequentialIdentifier(leftAndPrev)) {
        return leftAndPrev
    }

    const rightAndNext = [
        formula.subnode[formula.subnode.length - 1],
        next2Nodes[0],
    ]

    if (isSequentialIdentifier(rightAndNext)) {
        return rightAndNext
    }

    return false
}

function isSequentialIdentifier(nodes: Node[]) {
    return (
        1 < nodes.length &&
        nodes.every(
            (n) => n instanceof Identifier && !RESERVED_WORDS.has(n.value),
        )
    )
}
