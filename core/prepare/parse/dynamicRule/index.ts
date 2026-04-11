import { Evaluable, Expression, Identifier } from '../../../node/base.ts'
import { EOL } from '../../../node/misc.ts'
import { createLocalDynamicRules } from './functions/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

import type { CodeFile } from '../../../type/code-file.ts'
import type { Rule } from '../type.ts'
import { RULE_FLAGS } from '../type.ts'
import { ADVANCED_RULES, BASIC_RULES } from '../rule/index.ts'

export interface DynamicRulePattern {
    suffix: string
    next: string | 'parameter' | 'EOL' | null
}

export interface DynamicRuleSet {
    rules: [Rule[][], Rule[][]]
    patterns: DynamicRulePattern[]
    /** 이 파일에서 직접 선언된 함수 규칙만 포함. mentioning/baseContext 규칙 제외 */
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

    const patterns = extractFunctionPatterns([
        ...rules[0],
        ...rules[1],
        ...BASIC_RULES,
        ADVANCED_RULES,
    ])
    return {
        rules,
        patterns,
        localRules,
    }
}

function extractFunctionPatterns(ruleGroups: Rule[][]): DynamicRulePattern[] {
    const patterns: DynamicRulePattern[] = []

    if (!ruleGroups) return []

    for (const rules of ruleGroups) {
        if (!rules) continue

        for (const rule of rules) {
            if (
                !rule?.flags?.includes(RULE_FLAGS.IS_FUNCTION_INVOKE) &&
                !rule?.flags?.includes(RULE_FLAGS.IS_STATEMENT)
            ) {
                continue
            }

            if (!rule.pattern || rule.pattern.length < 2) continue

            for (let index = 1; index < rule.pattern.length; index++) {
                const currentPattern = rule.pattern[index]
                const prevPattern = rule.pattern[index - 1]

                // 매개변수 바로 뒤에 오는 식별자를 찾습니다. (접미사 후보)
                if (
                    currentPattern &&
                    prevPattern &&
                    currentPattern.type === Identifier &&
                    typeof currentPattern.value === 'string' &&
                    prevPattern.type === Evaluable
                ) {
                    const nextPattern = rule.pattern[index + 1]
                    let next: string | 'parameter' | null = null

                    if (nextPattern) {
                        if (
                            (nextPattern.type === Identifier ||
                                nextPattern.type === Expression) &&
                            typeof nextPattern.value === 'string'
                        ) {
                            next = nextPattern.value
                        } else if (nextPattern.type === Evaluable) {
                            next = 'parameter'
                        } else if (nextPattern.type === Identifier) {
                            // 특정 값 없이 Identifier만 명시된 경우 (예: 반복 변수명)
                            next = 'parameter'
                        } else if (nextPattern.type === EOL) {
                            next = 'EOL'
                        }
                    }
                    patterns.push({
                        suffix: currentPattern.value,
                        next,
                    })
                }
            }
        }
    }

    return patterns
}
