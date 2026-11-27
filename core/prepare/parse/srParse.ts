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
    DO_NOT_APPLY,
}

export interface ParsingHooks {
    onReduced?: (rule: SRRule, reduced: Node) => HookAction | void
    onShifted?: (shifted: Node) => HookAction | void
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

            const hookResult = hooks.onReduced?.(rule, reduced)
            if (hookResult === HookAction.DO_NOT_APPLY) {
                continue
            }

            buffer.splice(-rule.pattern.length, rule.pattern.length, reduced)

            changed = true

            if (hookResult === HookAction.EARLY_STOP) {
                break nodeloop
            }

            continue nodeloop
        }

        if (cursor === nodes.length) break

        const lastNode = buffer[buffer.length - 1]
        const pushingNode = nodes[cursor]!

        buffer.push(pushingNode)

        if (hooks.onShifted?.(pushingNode) === HookAction.EARLY_STOP) {
            break
        }

        // [ FunctionInvoke Operator ] 패턴
        if (
            lastNode instanceof FunctionInvoke &&
            pushingNode instanceof Operator &&
            lastNode.tokens.length !== 1
        ) {
            pushingNode.ambiguousTokens = lastNode.tokens.concat(
                pushingNode.tokens,
            )
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

    const rulesByLevel = [...BASIC_RULES, externalPatterns, ADVANCED_RULES]
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
