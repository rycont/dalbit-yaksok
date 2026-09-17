import { createLocalDynamicRules } from './functions/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

import type { CodeFile } from '../../../type/code-file.ts'
import type { Rule } from '../type.ts'

export interface DynamicRulePattern {
    suffix: string
    next: string | 'parameter' | 'EOL' | null
}

export interface DynamicRuleSet {
    rules: [Rule[][], Rule[][]]
    localRules: [Rule[][], Rule[][]]
}

export function createDynamicRule(codeFile: CodeFile): DynamicRuleSet {
    const localRules = createLocalDynamicRules(
        codeFile.tokens,
        codeFile.functionDeclareRanges,
    )

    const mentioningRules = getRulesFromMentioningFile(codeFile)
    const baseContextRules =
        codeFile.session?.baseContexts.flatMap(
            (context) => context.exportedRules,
        ) || []

    const extensionRules =
        codeFile.session?.extensions.flatMap(
            (extension) => extension.manifest.parsingRules || [],
        ) || []

    const rules: [Rule[][], Rule[][]] = [
        [extensionRules, ...localRules[0]],
        [...localRules[1], mentioningRules, baseContextRules],
    ]

    return {
        rules,
        localRules,
    }
}
