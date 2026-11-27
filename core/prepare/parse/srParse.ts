import {
    Node,
    type SRRule,
    getTokensFromNodes,
    Scope,
    Operator,
} from '@dalbit-yaksok/core'

import { BASIC_RULES, ADVANCED_RULES } from './rule/index.ts'
import { Ruleset } from './ruleset.ts'
import { NotAcceptableSignal } from './signal.ts'
import { FunctionInvoke } from '@dalbit-yaksok/statement-function'

export enum HookAction {
    EARLY_STOP,
}

export interface ParsingHooks {
    onReduce?: (rule: SRRule, reduced: Node) => HookAction | void
}

export function SRParse(
    scope: Scope,
    nodes: Node[],
    ruleset: Ruleset,
    hooks: ParsingHooks = {},
) {
    let cursor = 0
    const buffer: Node[] = []

    let changed = false

    nodeloop: while (true) {
        const matchedRules = ruleset.findRule(buffer)

        for (const rule of matchedRules) {
            const stackSlice = buffer.slice(-rule.pattern.length)

            if (rule.isStatement && cursor !== nodes.length) {
                continue
            }

            const reduced = reduce(stackSlice, rule, scope)

            if (reduced === null) continue

            if (
                stackSlice.length === 1 &&
                reduced.constructor === stackSlice[0].constructor
            ) {
                continue
            }

            buffer.splice(-rule.pattern.length, rule.pattern.length, reduced)

            changed = true

            if (hooks.onReduce?.(rule, reduced) === HookAction.EARLY_STOP) {
                break nodeloop
            }

            continue nodeloop
        }

        if (cursor === nodes.length) break

        const lastNode = buffer[buffer.length - 1]
        const pushingNode = nodes[cursor]!

        buffer.push(pushingNode)

        if (
            pushingNode instanceof Operator &&
            lastNode instanceof FunctionInvoke
        ) {
            console.log(pushingNode)
            pushingNode.ambiguousTokens = lastNode.tokens.concat(
                pushingNode.tokens,
            )
            // console.log(lastNode.tokens.concat(pushingNode.tokens))
        }

        cursor++
    }

    return {
        changed,
        nodes: buffer,
    }
}

export function reduce(nodes: Node[], rule: SRRule, scope: Scope) {
    const tokens = getTokensFromNodes(nodes)

    try {
        const reduced = rule.factory(nodes, tokens, scope)
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

export function callSRParseRecursively(
    scope: Scope,
    nodes: Node[],
    externalPatterns: SRRule[],
    hooks: ParsingHooks = {},
): Node[] {
    let parsedNodes = [...nodes]

    const rulesByLevel = [externalPatterns, ...BASIC_RULES, ADVANCED_RULES]
    const rulesets = rulesByLevel.map((rules) => Ruleset.createFromRules(rules))

    loop1: while (true) {
        for (const ruleset of rulesets) {
            const result = SRParse(scope, parsedNodes, ruleset, hooks)
            parsedNodes = result.nodes

            if (result.changed) continue loop1
        }

        break
    }

    return parsedNodes
}

// function hasFunctionInvokeCollision(
//     formula: Formula,
//     prev2Nodes: Node[],
//     next2Nodes: Node[],
// ) {
//     if (isSequentialIdentifier(prev2Nodes)) {
//         return prev2Nodes
//     }
//
//     const lastPrev = prev2Nodes[prev2Nodes.length - 1]
//
//     if (isSequentialIdentifier(next2Nodes)) {
//         // 반복 [목록] 의 [반복자] << 이 경우에서 `이 [반복자]` 패턴에서 (Identifier Identifier)로 인식되는 문제 방지
//
//         if (
//             lastPrev &&
//             lastPrev instanceof Identifier &&
//             lastPrev.value === '반복'
//         ) {
//             return false
//         }
//
//         return next2Nodes
//     }
//
//     const leftAndPrev = [lastPrev, formula.subnode[0]]
//
//     if (isSequentialIdentifier(leftAndPrev)) {
//         return leftAndPrev
//     }
//
//     const rightAndNext = [
//         formula.subnode[formula.subnode.length - 1],
//         next2Nodes[0],
//     ]
//
//     if (isSequentialIdentifier(rightAndNext)) {
//         return rightAndNext
//     }
//
//     return false
// }
//
// function isSequentialIdentifier(nodes: Node[]) {
//     return (
//         1 < nodes.length &&
//         nodes.every(
//             (n) => n instanceof Identifier && !RESERVED_WORDS.has(n.value),
//         )
//     )
// }
