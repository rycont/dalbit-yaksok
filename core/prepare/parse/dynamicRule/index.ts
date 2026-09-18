import { createLocalDynamicRules } from './functions/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

import type { Rule } from '../type.ts'
import { Token, YaksokSession } from '@dalbit-yaksok/core'

export interface DynamicRulePattern {
    suffix: string
    next: string | 'parameter' | 'EOL' | null
}

export function createDynamicRule(
    tokens: Token[],
    session: YaksokSession,
): [Rule[][], Rule[][]] {
    const localRules = createLocalDynamicRules(tokens)

    const mentioningRules = getRulesFromMentioningFile(tokens, session)
    const baseScopeRules = session.baseScope?.getDynamicRules() || []

    const rules: [Rule[][], Rule[][]] = [
        localRules[0],
        [...localRules[1], mentioningRules, baseScopeRules],
    ]

    return rules
}
