import { getTokensFromNodes } from '../../../../util/merge-tokens.ts'
import { Mention, MentionScope } from '../../../../node/mention.ts'
import { FunctionInvoke } from '../../../../node/function.ts'
import { Identifier, Node } from '../../../../node/base.ts'
import { Token } from '../../../tokenize/token.ts'

import type { Rule } from '../../type.ts'

export function createMentioningRule(
    fileName: string,
    originalRule: Rule,
): Rule {
    if (!originalRule.config?.exportedScope) {
        throw new Error('Mentioning에는 Exported Scope가 필요합니다')
    }

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
        factory: createFactory(fileName, originalRule),
    }
}

function createFactory(fileName: string, rule: Rule) {
    return (nodes: Node[], tokens: Token[]) => {
        const childNodes = nodes.slice(1)
        const childTokens = getTokensFromNodes(childNodes)

        const child = rule.factory(nodes.slice(1), childTokens) as
            | Identifier
            | FunctionInvoke

        return new MentionScope(
            fileName,
            rule.config!.exportedScope!,
            child,
            tokens,
        )
    }
}
