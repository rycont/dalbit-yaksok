import { Evaluable, Expression } from '../../../../node/base.ts'
import { Block } from '../../../../node/block.ts'
import { SubscribeEvent } from '../../../../node/event.ts'
import { EOL } from '../../../../node/misc.ts'
import { Token, TOKEN_TYPE } from '../../../tokenize/token.ts'
import { Rule } from '../../rule/index.ts'
import { convertTokensToFunctionTemplate } from './get-function-templates.ts'
import {
    createFunctionInvokeRule,
    parseParameterFromTemplate,
} from './invoke-rule.ts'

export function tokensToMethodEventSubscribeRule(
    prefixTokens: Token[],
    headerTokens: Token[],
): Rule[] {
    const eventId = findEventIdFromPrefixTokens(prefixTokens)
    const functionSignatureTokens =
        convertTokensToFunctionTemplate(headerTokens)

    // 이벤트를 구독하는 메소드 호출 패턴 생성
    // 패턴: Evaluable . HeaderPattern EOL Block

    const templates = createFunctionInvokeRule(functionSignatureTokens).map(
        (template) =>
            ({
                ...template,
                pattern: [
                    {
                        type: Evaluable,
                    },
                    {
                        type: Expression,
                        value: '.',
                    },
                    ...template.pattern,
                    {
                        type: EOL,
                    },
                    {
                        type: Block,
                    },
                ],
                factory(matchedNodes, tokens) {
                    const target = matchedNodes[0] as Evaluable

                    // matchedNodes[0]: Evaluable (target)
                    // matchedNodes[1]: .
                    // matchedNodes[2] ~ : params

                    const params = parseParameterFromTemplate(
                        functionSignatureTokens,
                        matchedNodes.slice(2),
                    )

                    const body = matchedNodes[matchedNodes.length - 1] as Block

                    return new SubscribeEvent(
                        { eventId, body, params, target },
                        tokens,
                    )
                },
            }) as Rule,
    )

    return templates
}

function findEventIdFromPrefixTokens(tokens: Token[]): string {
    for (let i = 0; i < tokens.length; i++) {
        if (
            tokens[i].type === TOKEN_TYPE.IDENTIFIER &&
            tokens[i].value === '이벤트'
        ) {
            let cursor = i + 1
            while (tokens[cursor]?.type === TOKEN_TYPE.SPACE) cursor++
            if (tokens[cursor]?.type === TOKEN_TYPE.OPENING_PARENTHESIS) {
                cursor++
                while (tokens[cursor]?.type === TOKEN_TYPE.SPACE) cursor++
                if (tokens[cursor]?.type === TOKEN_TYPE.IDENTIFIER) {
                    return tokens[cursor].value
                }
            }
        }
    }
    return ''
}
