import { ADVANCED_RULES, BASIC_RULES } from '../prepare/parse/rule.ts'

export const RESERVED_WORDS = new Set(
    [ADVANCED_RULES, ...BASIC_RULES]
        .flatMap((rules) =>
            rules.flatMap((rule) => rule.pattern.map((unit) => unit.value)),
        )
        .filter(Boolean),
) as Set<string>
