import { DynamicRules, Token, YaksokSession } from '@dalbit-yaksok/core'

import { buildLocalRules } from './local/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

export function createDynamicRules(
    tokens: Token[],
    session: YaksokSession,
): DynamicRules {
    const mentioningRules = getRulesFromMentioningFile(tokens, session)
    const localRules = buildLocalRules(tokens)

    const baseScopeRules = session.baseScope?.getExportedRules().toArray() || []

    return {
        replacers: localRules.replacers,
        rules: localRules.rules
            .concat(mentioningRules)
            .concat(baseScopeRules)
            .toSorted((a, b) => b.pattern.length - a.pattern.length),
    }
}
