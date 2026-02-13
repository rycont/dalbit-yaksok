import { Evaluable, Identifier } from '../../../node/base.ts'
import { createLocalDynamicRules } from './functions/index.ts'
import { getRulesFromMentioningFile } from './mention/index.ts'

import type { CodeFile } from '../../../type/code-file.ts'
import type { Rule } from '../type.ts'
import { RULE_FLAGS } from '../type.ts'

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
    const baseContextRules =
        codeFile.session?.baseContexts.flatMap(
            (context) => context.exportedRules,
        ) || []

    const extensionRules =
        codeFile.session?.extensions.flatMap(
            (extension) => extension.manifest.parsingRules || [],
        ) || []

    const rules: [Rule[][], Rule[][]] = [
        [...localRules[0]],
        [...localRules[1], extensionRules, mentioningRules, baseContextRules],
    ]

    // 함수 헤더 접미사는 함수 호출 규칙에서만 추출합니다.
    // rules[0]에는 확장 규칙(extensionRules)과 함수 선언 규칙(localRules[0])이 포함되어 있습니다.
    // rules[1]에는 함수 호출 규칙(invokingRules)과 외부에서 가져온 규칙들(mentioningRules, baseContextRules)이 포함되어 있습니다.
    // 이 중에서 함수 호출 규칙만 필터링하여 접미사를 추출합니다.
    const functionHeaderSuffixes = extractFunctionHeaderSuffixes([
        ...rules[0],
        ...rules[1],
    ])

    return {
        rules,
        functionHeaderSuffixes,
    }
}

function extractFunctionHeaderSuffixes(ruleGroups: Rule[][]): string[] {
    const suffixes = new Set<string>()

    if (!ruleGroups) {
        return []
    }

    for (const rules of ruleGroups) {
        if (!rules) continue

        for (const rule of rules) {
            // 함수 호출 규칙만 처리 (플래그로 확인)
            if (!rule?.flags?.includes(RULE_FLAGS.IS_FUNCTION_INVOKE)) {
                continue
            }

            if (!rule.pattern || rule.pattern.length < 2) continue

            for (let index = 1; index < rule.pattern.length; index++) {
                const currentPattern = rule.pattern[index]
                const prevPattern = rule.pattern[index - 1]

                if (
                    currentPattern &&
                    prevPattern &&
                    currentPattern.type === Identifier &&
                    typeof currentPattern.value === 'string' &&
                    prevPattern.type === Evaluable
                ) {
                    suffixes.add(currentPattern.value)
                }
            }
        }
    }

    return [...suffixes]
}
