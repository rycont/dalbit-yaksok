import {
    FunctionInvoke,
    Identifier,
    Mention,
    MentionScope,
    Node,
    Rule,
    Scope,
    Token,
} from '@dalbit-yaksok/core'
import { getTokensFromNodes } from '../../../../util/merge-tokens.ts'

export function createMentioningRule(
    fileName: string,
    originalRule: Rule,
    definedScope: Scope,
): Rule {
    const mergedPattern = [
        {
            type: Mention,
            value: fileName,
        },
        ...originalRule.pattern,
    ]

    return {
        pattern: mergedPattern,
        config: originalRule.config,
        flags: originalRule.flags,
        factory: createFactory(fileName, originalRule, definedScope),
    }
}

function createFactory(fileName: string, rule: Rule, definedScope: Scope) {
    return (nodes: Node[], tokens: Token[]) => {
        const childNodes = nodes.slice(1)
        const childTokens = getTokensFromNodes(childNodes)

        const child = rule.factory(nodes.slice(1), childTokens, rule) as
            | Identifier
            | FunctionInvoke

        return new MentionScope(fileName, definedScope, child, tokens)
    }
}
