import { ADVANCED_RULES, BASIC_RULES } from './rule.ts'
import { satisfiesPattern } from './satisfiesPattern.ts'

import { Block } from '../../node/block.ts'

import type { Node } from '../../node/base.ts'
import { Evaluable, Expression, Operator } from '../../node/base.ts'
import { getTokensFromNodes } from '../../util/merge-tokens.ts'
import { Rule, RULE_FLAGS } from './type.ts'
import { EOL } from '../../node/misc.ts'

export function SRParse(_nodes: Node[], rules: Rule[]) {
    const leftNodes = [..._nodes]
    const buffer: Node[] = []

    let changed = false

    nodeloop: while (true) {
        for (const rule of rules) {
            if (buffer.length < rule.pattern.length) continue

            const stackSlice = buffer.slice(-rule.pattern.length)
            const satisfies = satisfiesPattern(stackSlice, rule.pattern)

            if (!satisfies) continue

            // Special case: avoid matching binary operator pattern when indexing might follow
            if (rule.pattern.length === 3 && 
                rule.pattern[0].type === Evaluable &&
                rule.pattern[1].type === Operator &&
                rule.pattern[2].type === Evaluable) {
                
                // Check if the next token is '[' indicating indexing
                const nextToken = leftNodes[0]
                if (nextToken && nextToken instanceof Expression && nextToken.value === '[') {
                    continue
                }
            }

            const isStatement = rule.flags?.includes(RULE_FLAGS.IS_STATEMENT)

            if (isStatement) {
                const nextNode = leftNodes[0]
                if (nextNode && !(nextNode instanceof EOL)) continue

                const lastNode = buffer[buffer.length - rule.pattern.length - 1]
                if (lastNode && !(lastNode instanceof EOL)) continue
            }

            const reduced = reduce(stackSlice, rule)

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

    const reduced = rule.factory(nodes, tokens)
    reduced.position = nodes[0].position

    return reduced
}

export function callParseRecursively(
    _tokens: Node[],
    externalPatterns: [Rule[][], Rule[][]],
): Node[] {
    let parsedTokens = [..._tokens]

    for (let i = 0; i < parsedTokens.length; i++) {
        const token = parsedTokens[i]

        if (token instanceof Block) {
            token.children = callParseRecursively(
                token.children,
                externalPatterns,
            )
        }
    }

    const patternsByLevel = [
        ...externalPatterns[0],
        ...BASIC_RULES,
        ...externalPatterns[1],
        ADVANCED_RULES,
    ]

    loop1: while (true) {
        for (const patterns of patternsByLevel) {
            const result = SRParse(parsedTokens, patterns)
            parsedTokens = result.nodes

            if (result.changed) continue loop1
        }

        break
    }

    return parsedTokens
}
