import { Evaluable, Identifier } from '../../../node/base.ts'
import { createLocalDynamicRules } from './functions/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

import type { CodeFile } from '../../../type/code-file.ts'
import type { Rule } from '../type.ts'

export interface DynamicRuleSet {
    rules: [Rule[][], Rule[][]]
    functionHeaderSuffixes: string[]
}

export function createDynamicRule(codeFile: CodeFile): DynamicRuleSet {
    const localRules = createLocalDynamicRules(
        codeFile.tokens,
        codeFile.functionDeclareRanges,
    )

    const mentioningRules = getRulesFromMentioningFile(codeFile)
    const baseContextRules = codeFile.session?.baseContext?.exportedRules || []

    const extensionRules =
        codeFile.session?.extensions.flatMap(
            (extension) => extension.manifest.parsingRules || [],
        ) || []

    const rules: [Rule[][], Rule[][]] = [
        [extensionRules, ...localRules[0]],
        [...localRules[1], mentioningRules, baseContextRules],
    ]

    const functionHeaderSuffixes = extractFunctionHeaderSuffixes(rules[1])

    return {
        rules,
        functionHeaderSuffixes,
    }
}

function extractFunctionHeaderSuffixes(ruleGroups: Rule[][]): string[] {
    const suffixes = new Set<string>()

    for (const rules of ruleGroups) {
        for (const rule of rules) {
            for (let index = 1; index < rule.pattern.length; index++) {
                const currentPattern = rule.pattern[index]
                const prevPattern = rule.pattern[index - 1]

                if (
                    currentPattern.type === Identifier &&
                    typeof currentPattern.value === 'string' &&
                    prevPattern?.type === Evaluable
                ) {
                    suffixes.add(currentPattern.value)
                }
            }
        }
    }

    return [...suffixes]
}
