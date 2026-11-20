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
    RDRule,
    TOKEN_TYPE,
    TokenLine,
    createLineFetcher,
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
        rd: [createRDMentioning(fileName, originalRule.rd, declaredScope)],
    }
}

function createRDMentioning(
    fileName: string,
    originalRule: RDRule[],
    declaredScope: Scope,
): RDRule {
    const mentionHeadPattern = j
        .type<Token[]>()
        .list([
            j.field({
                type: j.literal(TOKEN_TYPE.MENTION),
                value: j.literal('@' + fileName),
            }),
            j.type<Token>().space().select('content'),
        ])
        .compile()

    return {
        name: '함수',
        factory(code, action) {
            const test = mentionHeadPattern.func(
                mentionHeadPattern.id,
                code.look.validTokens,
            )

            if (!test) {
                return null
            }

            const subline: TokenLine = {
                level: 0,
                validTokens: test.content,
                rawRange: code.look.rawRange,
            }

            const contentResult =
                originalRule
                    .values()
                    .map((r) =>
                        r.factory(
                            createLineFetcher([subline]),
                            action,
                            declaredScope,
                        ),
                    )
                    .find((r) => r !== null) || null

            return contentResult
        },
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
