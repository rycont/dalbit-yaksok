import { Block } from '../../../../node/block.ts'
import { SubscribeEvent } from '../../../../node/event.ts'
import { EOL } from '../../../../node/misc.ts'
import { Token } from '../../../tokenize/token.ts'
import { Rule } from '../../rule/index.ts'
import { convertTokensToFunctionTemplate } from './get-function-templates.ts'
import {
    createFunctionInvokeRule,
    parseParameterFromTemplate,
} from './invoke-rule.ts'

export function tokensToEventSubscribeRule(templateTokens: Token[]): Rule[] {
    const templates = createFunctionInvokeRule(
        convertTokensToFunctionTemplate(templateTokens.slice(6)),
    ).map(
        (template) =>
            ({
                ...template,
                pattern: [
                    ...template.pattern,
                    {
                        type: EOL,
                    },
                    {
                        type: Block,
                    },
                ],
                factory(matchedNodes, tokens) {
                    const params = parseParameterFromTemplate(
                        convertTokensToFunctionTemplate(
                            templateTokens.slice(6),
                        ),
                        matchedNodes,
                    )

                    const eventId = templateTokens[2].value as string
                    const body = matchedNodes[matchedNodes.length - 1] as Block

                    return new SubscribeEvent({ eventId, body, params }, tokens)
                },
            } as Rule),
    )

    return templates
}
