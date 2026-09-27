import {
    Block,
    EOL,
    Formula,
    FormularInFunctionCall,
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
            const isStatement = !!rule.config?.statement

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

                if (
                    hasFunctionInvokeCollision(reduced, prev2Nodes, next2Nodes)
                ) {
                    reduced.injectParsingError(new FormularInFunctionCall())
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
    _tokens: Node[],
    externalPatterns: Rule[],
): Node[] {
    let parsedTokens = [..._tokens]

    for (let i = 0; i < parsedTokens.length; i++) {
        const token = parsedTokens[i]

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
            const result = SRParse(parsedTokens, ruleset)
            parsedTokens = result.nodes

            if (result.changed) continue loop1
        }

        break
    }

    return parsedTokens
}

function hasFunctionInvokeCollision(
    formula: Formula,
    prev2Nodes: Node[],
    next2Nodes: Node[],
) {
    if (isSequentialIdentifier(prev2Nodes)) {
        return true
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

        return true
    }

    if (isSequentialIdentifier([lastPrev, formula.subnode[0]])) {
        return true
    }

    if (
        isSequentialIdentifier([
            formula.subnode[formula.subnode.length - 1],
            next2Nodes[0],
        ])
    ) {
        return true
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
