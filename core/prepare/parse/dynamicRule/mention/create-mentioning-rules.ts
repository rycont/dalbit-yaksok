import { Mention, MentionScope } from '../../../../node/mention.ts'
import { FunctionInvoke } from '../../../../node/function.ts'
import { Identifier, Node } from '../../../../node/base.ts'
import { Rule } from '../../rule.ts'
import { Token } from '../../../tokenize/token.ts'
import { getTokensFromNodes } from '../../../../util/merge-tokens.ts'

export function createMentioningRule(
    fileName: string,
    originalRule: Rule,
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
        child.position = nodes[1].position

        return new MentionScope(fileName, child, tokens)
    }
}
