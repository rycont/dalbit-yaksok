import { satisfiesPattern } from './satisfiesPattern.ts'
import { Rule, internalPatternsByLevel } from './rule.ts'

import { Block, EOL, Node } from '../../node/index.ts'

export function SRParse(_tokens: Node[], rules: Rule[]) {
    const tokens = [..._tokens]
    const stack: Node[] = []

    let changed = false

    tokenloop: while (true) {
        for (const rule of rules) {
            if (stack.length < rule.pattern.length) continue

            const stackSlice = stack.slice(-rule.pattern.length)
            const isSatisfies = satisfiesPattern(stackSlice, rule.pattern)

            if (!isSatisfies) continue
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

export function reduce(tokens: Node[], rule: Rule) {
    const args: Record<string, unknown> = { ...rule.config } || {}
    let hasArgs = rule.config ? true : undefined

    for (let i = 0; i < rule.pattern.length; i++) {
        const pattern = rule.pattern[i]

        if (!pattern.as) continue

        args[pattern.as] = tokens[i]
        hasArgs = true
    }

    const reduced = new rule.to(hasArgs && args)
    return reduced
}

export function callParseRecursively(_tokens: Node[], patterns: Rule[]) {
    const tokens = [..._tokens]

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if (!(token instanceof Block)) continue
        tokens[i] = callParseRecursively(token.children, patterns)
    }

    tokens.push(new EOL())

    let parsedTokens: Node[] = tokens

    while (true) {
        let changed = false

        for (const internalPatterns of internalPatternsByLevel) {
            const result = SRParse(parsedTokens, [
                ...internalPatterns,
                ...patterns,
            ])

            if (!result.changed) continue

            changed = true
            parsedTokens = result.tokens
        }

        if (!changed) break
    }

    return new Block(parsedTokens)
}
