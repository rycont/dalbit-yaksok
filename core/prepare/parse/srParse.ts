import { type Rule, ADVANCED_RULES, BASIC_RULES } from './rule.ts'
import { satisfiesPattern } from './satisfiesPattern.ts'

import { Block } from '../../node/block.ts'
import { TOKEN_TYPE } from '../tokenize/token.ts'
import { EOL } from '../../node/misc.ts'

import type { Node } from '../../node/base.ts'
import { getTokensFromNodes } from '../../util/merge-tokens.ts'

export function SRParse(_tokens: Node[], rules: Rule[]) {
    const tokens = [..._tokens]
    const stack: Node[] = []

    let changed = false

    tokenloop: while (true) {
        for (const rule of rules) {
            if (stack.length < rule.pattern.length) continue

            const stackSlice = stack.slice(-rule.pattern.length)
            const satisfies = satisfiesPattern(stackSlice, rule.pattern)

            if (!satisfies) continue
            const reduced = reduce(stackSlice, rule)

            stack.splice(-rule.pattern.length, rule.pattern.length, reduced)

            changed = true
            continue tokenloop
        }

        if (tokens.length === 0) break
        stack.push(tokens.shift()!)
    }

    return {
        changed,
        tokens: stack,
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
    externalPatterns: Rule[],
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

    parsedTokens.push(
        new EOL([
            {
                position: { column: 0, line: 0 },
                value: '\n',
                type: TOKEN_TYPE.NEW_LINE,
            },
        ]),
    )

    const patternsByLevel = [...BASIC_RULES, externalPatterns, ADVANCED_RULES]

    loop1: while (true) {
        for (const patterns of patternsByLevel) {
            const result = SRParse(parsedTokens, patterns)
            parsedTokens = result.tokens

            if (result.changed) continue loop1
        }

        break
    }

    return parsedTokens
}
