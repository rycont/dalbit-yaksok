import {
    FunctionInvoke,
    Identifier,
    Mention,
    MentionScope,
    Node,
    r,
    Rule,
    Scope,
    Token,
} from '@dalbit-yaksok/core'
import { getTokensFromNodes } from '../../../../util/merge-tokens.ts'
import { j } from '@dalbit-yaksok/pattern'

export function createMentioningRule(
    fileName: string,
    originalRule: Rule,
    declaredScope: Scope,
): Rule {
    const mergedPattern = [
        j.instance(Mention).field({ value: j.literal(fileName) }),
        ...originalRule.pattern,
    ]

    return r({
        pattern: mergedPattern,
        factory: createFactory(fileName, originalRule, declaredScope),
    })
}

function createFactory(fileName: string, rule: Rule, declaredScope: Scope) {
    return (nodes: Node[], tokens: Token[]) => {
        const childNodes = nodes.slice(1)
        const childTokens = getTokensFromNodes(childNodes)

        const child = rule.factory(nodes.slice(1), childTokens, rule) as
            | Identifier
            | FunctionInvoke

        return new MentionScope(fileName, declaredScope, child, tokens)
    }
}
