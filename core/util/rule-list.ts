import { RuleList } from '@dalbit-yaksok/core'

export function concatRuleList(items: (RuleList | undefined)[]): RuleList {
    if (items.length < 2) {
        return (
            items[0] ?? {
                rd: [],
                sr: [],
            }
        )
    }

    const rest = concatRuleList(items.slice(1))

    return {
        rd: (items?.[0]?.rd || []).concat(rest.rd || []),
        sr: (items?.[0]?.sr || []).concat(rest.sr || []),
    }
}

export function createRuleList(): RuleList {
    return {
        rd: [],
        sr: [],
    }
}
