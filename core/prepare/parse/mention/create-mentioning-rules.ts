import {
    Mention,
    MentionScope,
    Node,
    r,
    Scope,
    getTokensFromNodes,
    type SRRule,
    type Token,
    Evaluable,
    RuleList,
} from '@dalbit-yaksok/core'
import { j } from '@dalbit-yaksok/pattern'

export function createMentioningRule(
    fileName: string,
    originalRule: RuleList,
    declaredScope: Scope,
): RuleList {
    return {
        sr: originalRule.sr.map((r) =>
            createSRMentioning(fileName, r, declaredScope),
        ),
        rd: [],
    }
}

function createSRMentioning(
    fileName: string,
    originalRule: SRRule,
    declaredScope: Scope,
) {
    const mergedPattern = [
        j.instance(Mention).field({ value: j.literal(fileName) }),
        ...originalRule.pattern,
    ]

    return r({
        pattern: mergedPattern,
        factory: createFactory(fileName, originalRule, declaredScope),
    })
}

function createFactory(fileName: string, rule: SRRule, declaredScope: Scope) {
    return (nodes: Node[], tokens: Token[]) => {
        const childNodes = nodes.slice(1)
        const childTokens = getTokensFromNodes(childNodes)

        const child = rule.factory(
            nodes.slice(1),
            childTokens,
            rule,
        ) as Evaluable

        return new MentionScope(fileName, declaredScope, child, tokens)
    }
}
